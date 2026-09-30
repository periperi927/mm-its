from typing import List
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.core.security import get_current_user
from app.db.session import get_db
from app.models.schemas import (
    SignalStateResponse,
    SignalStateUpdate,
    TelemetryData,
    TelemetryResponse,
)
from app.services.green_wave import GreenWaveService

router = APIRouter(prefix="/api/v1/traffic", tags=["Traffic Signals & Telemetry"])


@router.post(
    "/telemetry",
    response_model=TelemetryResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Submit Traffic Sensor Telemetry",
)
def submit_telemetry(
    data: TelemetryData,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
  """Record real-time traffic sensor metrics including vehicle count, speed, and lane occupancy."""
  service = GreenWaveService(db)
  telemetry = service.record_sensor_telemetry(
      sensor_id=data.sensor_id,
      corridor_name=data.corridor_name,
      lgu=data.lgu_jurisdiction,
      vehicle_count=data.vehicle_count_per_min,
      avg_speed=data.average_speed_kmh,
      occupancy_rate=data.occupancy_rate_percent,
  )
  return telemetry


@router.put(
    "/signal-state",
    response_model=SignalStateResponse,
    summary="Update Traffic Signal State",
)
def update_signal_state(
    payload: SignalStateUpdate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
  """Update green-light timing, traffic state classification, and signal overrides for a corridor."""
  service = GreenWaveService(db)
  signal = service.update_signal_state(
      sensor_id=payload.sensor_id,
      corridor_name=payload.corridor_name,
      jurisdiction=payload.jurisdiction,
      state=payload.traffic_state,
      green_sec=payload.recommended_green_sec,
      coordination_group=payload.coordination_group,
      override=payload.signal_phase_override,
  )
  return signal