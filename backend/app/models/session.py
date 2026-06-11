from sqlalchemy import Column, String, Text, DateTime, JSON, Integer, Float
from sqlalchemy import func
from app.core.database import Base
import uuid


class EvaluationSession(Base):
    __tablename__ = "evaluation_sessions"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    reference_pose_id = Column(String, nullable=False, index=True)
    reference_pose_name = Column(String(200), nullable=False)
    student_id = Column(String, nullable=True)
    student_name = Column(String(200), nullable=True)
    frames = Column(JSON, nullable=False, default=list)
    average_score = Column(Float, nullable=False, default=0.0)
    duration = Column(Integer, nullable=False, default=0)
    started_at = Column(DateTime(timezone=True), nullable=False)
    ended_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
