import json
import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from geoalchemy2.shape import from_shape, to_shape
from shapely.geometry import shape
from sqlalchemy import func
from sqlalchemy.orm import Session, selectinload

from app.database import get_db
from app.deps import get_current_user
from app.models import Project, Site, User
from app.schemas import SiteCreate, SiteDetail, SiteOut

router = APIRouter(prefix="/api/sites", tags=["sites"])


def _geom_to_geojson(geom) -> dict:
    """Convert a PostGIS geometry column value to a GeoJSON dict."""
    return json.loads(json.dumps(to_shape(geom).__geo_interface__))


@router.get("", response_model=list[SiteOut])
def list_sites(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    rows = (
        db.query(Site)
        .join(Project, Site.project_id == Project.id)
        .filter(Project.owner_id == user.id)
        .all()
    )
    return [
        SiteOut(
            id=s.id,
            project_id=s.project_id,
            name=s.name,
            area_hectares=s.area_hectares,
            geometry=_geom_to_geojson(s.geom),
        )
        for s in rows
    ]


@router.post("", response_model=SiteOut, status_code=status.HTTP_201_CREATED)
def create_site(
    payload: SiteCreate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    project = (
        db.query(Project)
        .filter(Project.id == payload.project_id, Project.owner_id == user.id)
        .first()
    )
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    if payload.geometry.get("type") != "Polygon":
        raise HTTPException(status_code=400, detail="geometry must be a GeoJSON Polygon")

    try:
        poly = shape(payload.geometry)
    except Exception as exc:
        raise HTTPException(status_code=400, detail=f"Invalid geometry: {exc}") from exc

    # Accurate spherical area via geography cast (metres²), then convert to hectares.
    area_m2 = db.execute(func.ST_Area(func.ST_GeogFromText(poly.wkt))).scalar() or 0.0
    area_ha = float(area_m2) / 10_000.0

    site = Site(
        project_id=project.id,
        name=payload.name,
        geom=from_shape(poly, srid=4326),
        area_hectares=area_ha,
    )
    db.add(site)
    db.commit()
    db.refresh(site)

    return SiteOut(
        id=site.id,
        project_id=site.project_id,
        name=site.name,
        area_hectares=site.area_hectares,
        geometry=_geom_to_geojson(site.geom),
    )


@router.get("/{site_id}", response_model=SiteDetail)
def get_site(
    site_id: uuid.UUID,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    site = (
        db.query(Site)
        .options(selectinload(Site.metrics))
        .join(Project, Site.project_id == Project.id)
        .filter(Site.id == site_id, Project.owner_id == user.id)
        .first()
    )
    if not site:
        raise HTTPException(status_code=404, detail="Site not found")

    return SiteDetail(
        id=site.id,
        project_id=site.project_id,
        name=site.name,
        area_hectares=site.area_hectares,
        geometry=_geom_to_geojson(site.geom),
        metrics=site.metrics,
    )


@router.delete("/{site_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_site(
    site_id: uuid.UUID,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    site = (
        db.query(Site)
        .join(Project, Site.project_id == Project.id)
        .filter(Site.id == site_id, Project.owner_id == user.id)
        .first()
    )
    if not site:
        raise HTTPException(status_code=404, detail="Site not found")
    db.delete(site)
    db.commit()
