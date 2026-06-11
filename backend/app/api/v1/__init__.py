from fastapi import APIRouter
from .poses import router as poses_router
from .sessions import router as sessions_router

api_router = APIRouter(prefix="/api/v1")
api_router.include_router(poses_router)
api_router.include_router(sessions_router)
