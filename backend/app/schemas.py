import uuid
from datetime import datetime
from typing import Any, List

from pydantic import BaseModel, EmailStr, Field


# ---------- Auth ----------
class UserCreate(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8)


class UserOut(BaseModel):
    id: uuid.UUID
    email: EmailStr

    class Config:
        from_attributes = True


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


# ---------- Projects ----------
class ProjectCreate(BaseModel):
    name: str = Field(min_length=1, max_length=200)
    description: str | None = None


class ProjectOut(BaseModel):
    id: uuid.UUID
    name: str
    description: str | None
    created_at: datetime

    class Config:
        from_attributes = True


# ---------- Sites ----------
class SiteCreate(BaseModel):
    project_id: uuid.UUID
    name: str = Field(min_length=1, max_length=200)
    geometry: dict[str, Any]  # GeoJSON Polygon


class SiteOut(BaseModel):
    id: uuid.UUID
    project_id: uuid.UUID
    name: str
    area_hectares: float
    geometry: dict[str, Any]


# ---------- Metrics ----------
class MetricOut(BaseModel):
    recorded_at: datetime
    carbon_tons: float
    biodiversity_index: float

    class Config:
        from_attributes = True


class SiteDetail(SiteOut):
    metrics: List[MetricOut] = []