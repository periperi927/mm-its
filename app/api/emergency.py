import uuid
from fastapi import APIRouter, Depends, status
from app.core.security import get_current_user
from app.models.db_models import User
from app.models.schemas import (
    EmergencyDispatchRequest,
    EmergencyDispatchResponse,
)

# Prefix explicitly specified here
router = APIRouter(prefix="/api/v1/emergency", tags=["Emergency"])


@router.post(
    "/dispatch",
    response_model=EmergencyDispatchResponse,
    status_code=status.HTTP_201_CREATED,
)
async def trigger_emergency_preemption(
    payload: EmergencyDispatchRequest,
    current_user: User = Depends(get_current_user),
):
    dispatch_id = f"EMG-{uuid.uuid4().hex[:8].upper()}"

    return {
        "dispatch_id": dispatch_id,
        "unit_id": payload.unit_id,
        "agency": payload.agency,
        "corridor_name": payload.corridor_name,
        "status": "GREEN_WAVE_ACTIVATED",
        "overrides_applied": 0,
    }