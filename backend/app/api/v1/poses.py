from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.pose import ReferencePose
from app.schemas.pose import ReferencePoseCreate, ReferencePoseUpdate, ReferencePoseResponse
from datetime import datetime, timezone

router = APIRouter(prefix="/poses", tags=["Poses de Referencia"])


@router.get("/", response_model=list[ReferencePoseResponse])
def get_all_poses(db: Session = Depends(get_db)) -> list[ReferencePose]:
    return db.query(ReferencePose).order_by(ReferencePose.created_at.desc()).all()


@router.get("/{pose_id}", response_model=ReferencePoseResponse)
def get_pose(pose_id: str, db: Session = Depends(get_db)) -> ReferencePose:
    pose = db.query(ReferencePose).filter(ReferencePose.id == pose_id).first()
    if not pose:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Pose no encontrada")
    return pose


@router.post("/", response_model=ReferencePoseResponse, status_code=status.HTTP_201_CREATED)
def create_pose(
    pose_data: ReferencePoseCreate, db: Session = Depends(get_db)
) -> ReferencePose:
    pose = ReferencePose(
        name=pose_data.name,
        description=pose_data.description,
        category=pose_data.category.value,
        landmarks=pose_data.landmarks,
        world_landmarks=pose_data.world_landmarks,
        angles=pose_data.angles,
        tolerances=pose_data.tolerances,
        image_data_url=pose_data.image_data_url,
        created_by=pose_data.created_by,
    )
    db.add(pose)
    db.commit()
    db.refresh(pose)
    return pose


@router.put("/{pose_id}", response_model=ReferencePoseResponse)
def update_pose(
    pose_id: str, updates: ReferencePoseUpdate, db: Session = Depends(get_db)
) -> ReferencePose:
    pose = db.query(ReferencePose).filter(ReferencePose.id == pose_id).first()
    if not pose:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Pose no encontrada")

    for field, value in updates.model_dump(exclude_none=True).items():
        setattr(pose, field, value.value if hasattr(value, "value") else value)

    pose.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(pose)
    return pose


@router.delete("/{pose_id}")
def delete_pose(pose_id: str, db: Session = Depends(get_db)) -> dict:
    pose = db.query(ReferencePose).filter(ReferencePose.id == pose_id).first()
    if not pose:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Pose no encontrada")
    db.delete(pose)
    db.commit()
    return {"success": True, "message": f"Pose {pose_id} eliminada"}
