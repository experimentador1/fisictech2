from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.session import EvaluationSession
from app.schemas.session import SessionCreate, SessionResponse
from typing import Any

router = APIRouter(prefix="/sessions", tags=["Sesiones de Evaluación"])


@router.get("/", response_model=list[SessionResponse])
def get_all_sessions(db: Session = Depends(get_db)) -> list[EvaluationSession]:
    return (
        db.query(EvaluationSession)
        .order_by(EvaluationSession.started_at.desc())
        .all()
    )


@router.get("/{session_id}", response_model=SessionResponse)
def get_session(session_id: str, db: Session = Depends(get_db)) -> EvaluationSession:
    sess = (
        db.query(EvaluationSession)
        .filter(EvaluationSession.id == session_id)
        .first()
    )
    if not sess:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Sesión no encontrada")
    return sess


@router.post("/", response_model=SessionResponse, status_code=status.HTTP_201_CREATED)
def create_session(
    session_data: SessionCreate, db: Session = Depends(get_db)
) -> EvaluationSession:
    sess = EvaluationSession(
        reference_pose_id=session_data.reference_pose_id,
        reference_pose_name=session_data.reference_pose_name,
        student_id=session_data.student_id,
        student_name=session_data.student_name,
        frames=session_data.frames,
        average_score=session_data.average_score,
        duration=session_data.duration,
        started_at=session_data.started_at,
        ended_at=session_data.ended_at,
    )
    db.add(sess)
    db.commit()
    db.refresh(sess)
    return sess


@router.delete("/{session_id}")
def delete_session(session_id: str, db: Session = Depends(get_db)) -> dict[str, Any]:
    sess = (
        db.query(EvaluationSession)
        .filter(EvaluationSession.id == session_id)
        .first()
    )
    if not sess:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Sesión no encontrada")
    db.delete(sess)
    db.commit()
    return {"success": True, "message": f"Sesión {session_id} eliminada"}


@router.get("/stats/summary")
def get_stats(db: Session = Depends(get_db)) -> dict[str, Any]:
    sessions = db.query(EvaluationSession).all()
    if not sessions:
        return {"totalSessions": 0, "averageScore": 0, "totalDurationMinutes": 0}

    avg = sum(s.average_score for s in sessions) / len(sessions)
    total_duration = sum(s.duration for s in sessions)
    return {
        "totalSessions": len(sessions),
        "averageScore": round(avg, 1),
        "totalDurationMinutes": round(total_duration / 60, 1),
    }
