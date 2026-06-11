from pydantic import BaseModel, Field
from typing import Optional, Any
from datetime import datetime
from enum import Enum


class PoseCategory(str, Enum):
    pilates = "pilates"
    yoga = "yoga"
    stretching = "stretching"
    strength = "strength"
    other = "other"


class LandmarkSchema(BaseModel):
    x: float
    y: float
    z: float
    visibility: Optional[float] = None
    presence: Optional[float] = None


class ReferencePoseCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=200)
    description: Optional[str] = None
    category: PoseCategory = PoseCategory.other
    landmarks: list[dict[str, Any]] = Field(default_factory=list)
    world_landmarks: list[dict[str, Any]] = Field(default_factory=list)
    angles: dict[str, float] = Field(default_factory=dict)
    tolerances: dict[str, float] = Field(default_factory=dict)
    image_data_url: Optional[str] = None
    created_by: Optional[str] = None


class ReferencePoseUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    category: Optional[PoseCategory] = None
    angles: Optional[dict[str, float]] = None
    tolerances: Optional[dict[str, float]] = None
    image_data_url: Optional[str] = None


class ReferencePoseResponse(BaseModel):
    id: str
    name: str
    description: Optional[str] = None
    category: str
    landmarks: list[dict[str, Any]]
    world_landmarks: list[dict[str, Any]]
    angles: dict[str, float]
    tolerances: dict[str, float]
    image_data_url: Optional[str] = None
    created_by: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
