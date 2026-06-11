from sqlalchemy import Column, String, Text, DateTime, JSON
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy import func
from app.core.database import Base
import uuid


class ReferencePose(Base):
    __tablename__ = "reference_poses"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String(200), nullable=False, index=True)
    description = Column(Text, nullable=True)
    category = Column(String(50), nullable=False, default="other")
    landmarks = Column(JSON, nullable=False, default=list)
    world_landmarks = Column(JSON, nullable=False, default=list)
    angles = Column(JSON, nullable=False, default=dict)
    tolerances = Column(JSON, nullable=False, default=dict)
    image_data_url = Column(Text, nullable=True)
    created_by = Column(String(200), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
