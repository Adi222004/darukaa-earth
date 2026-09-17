"""Seed the database with demo data.

Run from backend/ with the venv active:
    python scripts/seed.py
"""

import random
import sys
from datetime import datetime, timedelta
from pathlib import Path

# Make `app` importable when running this file directly
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from geoalchemy2.shape import from_shape  # noqa: E402
from shapely.geometry import Polygon  # noqa: E402
from sqlalchemy import func  # noqa: E402

from app.database import SessionLocal  # noqa: E402
from app.models import Project, Site, SiteMetric, User  # noqa: E402
from app.security import hash_password  # noqa: E402

DEMO_EMAIL = "demo@darukaa.com"
DEMO_PASSWORD = "password123"

PROJECTS = [
    {
        "name": "Western Ghats Restoration",
        "description": "Reforestation and biodiversity corridor in Karnataka.",
        "sites": [
            (
                "Kodagu Evergreen Plot",
                [
                    (75.70, 12.30),
                    (75.85, 12.30),
                    (75.85, 12.45),
                    (75.70, 12.45),
                    (75.70, 12.30),
                ],
            ),
            (
                "Agumbe Rainforest Site",
                [
                    (75.05, 13.45),
                    (75.20, 13.45),
                    (75.20, 13.60),
                    (75.05, 13.60),
                    (75.05, 13.45),
                ],
            ),
        ],
    },
    {
        "name": "Sundarbans Mangrove Program",
        "description": "Mangrove restoration and blue carbon in West Bengal.",
        "sites": [
            (
                "Sundarbans Core Zone",
                [
                    (88.10, 21.60),
                    (88.20, 21.60),
                    (88.20, 21.70),
                    (88.10, 21.70),
                    (88.10, 21.60),
                ],
            ),
            (
                "Sundarbans Buffer Zone",
                [
                    (88.30, 21.70),
                    (88.42, 21.70),
                    (88.42, 21.80),
                    (88.30, 21.80),
                    (88.30, 21.70),
                ],
            ),
        ],
    },
    {
        "name": "Aravalli Green Belt",
        "description": "Dry deciduous restoration along the Aravalli range.",
        "sites": [
            (
                "Alwar Ridge Plot",
                [
                    (76.55, 27.50),
                    (76.65, 27.50),
                    (76.65, 27.60),
                    (76.55, 27.60),
                    (76.55, 27.50),
                ],
            ),
            (
                "Sariska Buffer",
                [
                    (76.25, 27.25),
                    (76.40, 27.25),
                    (76.40, 27.35),
                    (76.25, 27.35),
                    (76.25, 27.25),
                ],
            ),
        ],
    },
]


def seed():
    db = SessionLocal()
    try:
        print("-> Wiping existing users, projects, sites, and metrics...")
        db.query(SiteMetric).delete()
        db.query(Site).delete()
        db.query(Project).delete()
        db.query(User).delete()
        db.commit()

        print(f"-> Creating demo user: {DEMO_EMAIL}")
        user = User(email=DEMO_EMAIL, hashed_password=hash_password(DEMO_PASSWORD))
        db.add(user)
        db.commit()
        db.refresh(user)

        random.seed(42)

        for p_data in PROJECTS:
            print(f"-> Creating project: {p_data['name']}")
            project = Project(
                name=p_data["name"],
                description=p_data["description"],
                owner_id=user.id,
            )
            db.add(project)
            db.commit()
            db.refresh(project)

            for site_name, coords in p_data["sites"]:
                poly = Polygon(coords)

                area_m2 = db.execute(
                    func.ST_Area(func.ST_GeogFromText(poly.wkt))
                ).scalar() or 0.0
                area_ha = float(area_m2) / 10_000.0

                site = Site(
                    project_id=project.id,
                    name=site_name,
                    geom=from_shape(poly, srid=4326),
                    area_hectares=area_ha,
                )
                db.add(site)
                db.commit()
                db.refresh(site)

                print(f"   +- site: {site_name}  ({area_ha:.1f} ha)")

                now = datetime.utcnow()
                base_carbon = area_ha * 0.8
                base_bio = 0.55

                for month in range(11, -1, -1):
                    recorded = now - timedelta(days=30 * month)
                    growth = (11 - month) * random.uniform(0.015, 0.03)
                    carbon = base_carbon * (1 + growth)
                    bio = min(
                        1.0,
                        base_bio + (11 - month) * 0.02 + random.uniform(-0.02, 0.02),
                    )
                    db.add(
                        SiteMetric(
                            site_id=site.id,
                            recorded_at=recorded,
                            carbon_tons=round(carbon, 2),
                            biodiversity_index=round(bio, 3),
                        )
                    )

        db.commit()
        print()
        print("Seed complete.")
        print(f"   Login with: {DEMO_EMAIL} / {DEMO_PASSWORD}")
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed()