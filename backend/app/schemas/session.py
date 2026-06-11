from pydantic import BaseModel, Field
from typing import Optional, Any
from datetime import datetime


class SessionCreate(BaseModel):
    reference_pose_id: str
    reference_pose_name: str
    student_id: Optional[str] = None
    student_name: Optional[str] = None
    frames: list[dict[str, Any]] = Field(default_factory=list)
    average_score: float = 0.0
    duration: int = 0
    started_at: datetime
    ended_at: Optional[datetime] = None


class SessionResponse(BaseModel):
    id: str
    reference_pose_id: str
    reference_pose_name: str
    student_id: Optional[str] = None
    student_name: Optional[str] = None
    frames: list[dict[str, Any]]
    average_score: float
    duration: int
    started_at: datetime
    ended_at: Optional[datetime] = None
    created_at: datetime

    model_config = {"from_attributes": True}
