import json
from datetime import datetime
from typing import Any, Dict, List
from sqlalchemy.orm import Session

from app.db.redis import redis_client
from app.models.db_models import (
    EmergencyDispatchLogModel,
    SensorTelemetryModel,
    TrafficSignalStateModel,
)
from app.models.schemas import AgencyType

CACHE_TTL_SECONDS = 300  # 5 minutes TTL for real-time telemetry cache


class GreenWaveService:

  def __init__(self, db: Session):
    self.db = db

  def record_sensor_telemetry(
      self,
      sensor_id: str,
      corridor_name: str,
      lgu: AgencyType,
      vehicle_count: int,
      avg_speed: float,
      occupancy_rate: float,
  ) -> SensorTelemetryModel:
    telemetry = SensorTelemetryModel(
        sensor_id=sensor_id,
        corridor_name=corridor_name,
        lgu_jurisdiction=lgu,
        vehicle_count_per_min=vehicle_count,
        average_speed_kmh=avg_speed,
        occupancy_rate_percent=occupancy_rate,
        timestamp=datetime.utcnow(),
    )
    self.db.add(telemetry)
    self.db.commit()
    self.db.refresh(telemetry)

    # Cache the latest telemetry state in Redis
    try:
      cache_payload = {
          "id": telemetry.id,
          "sensor_id": telemetry.sensor_id,
          "corridor_name": telemetry.corridor_name,
          "lgu_jurisdiction": (
              telemetry.lgu_jurisdiction.value
              if hasattr(telemetry.lgu_jurisdiction, "value")
              else str(telemetry.lgu_jurisdiction)
          ),
          "vehicle_count_per_min": telemetry.vehicle_count_per_min,
          "average_speed_kmh": telemetry.average_speed_kmh,
          "occupancy_rate_percent": telemetry.occupancy_rate_percent,
          "timestamp": telemetry.timestamp.isoformat(),
      }
      redis_client.setex(
          f"telemetry:latest:{sensor_id}",
          CACHE_TTL_SECONDS,
          json.dumps(cache_payload),
      )
    except Exception:
      pass  # Ensure database save succeeds even if Redis is unreachable

    return telemetry

  def get_latest_sensor_telemetry(
      self, sensor_id: str
  ) -> Dict[str, Any] | None:
    """Retrieves telemetry reading from Redis cache first, falling back to PostgreSQL."""
    cache_key = f"telemetry:latest:{sensor_id}"

    # 1. Read from Redis
    try:
      cached_data = redis_client.get(cache_key)
      if cached_data:
        return json.loads(cached_data)
    except Exception:
      pass

    # 2. Fallback to PostgreSQL
    telemetry = (
        self.db.query(SensorTelemetryModel)
        .filter(SensorTelemetryModel.sensor_id == sensor_id)
        .order_by(SensorTelemetryModel.timestamp.desc())
        .first()
    )

    if not telemetry:
      return None

    return {
        "id": telemetry.id,
        "sensor_id": telemetry.sensor_id,
        "corridor_name": telemetry.corridor_name,
        "lgu_jurisdiction": (
            telemetry.lgu_jurisdiction.value
            if hasattr(telemetry.lgu_jurisdiction, "value")
            else str(telemetry.lgu_jurisdiction)
        ),
        "vehicle_count_per_min": telemetry.vehicle_count_per_min,
        "average_speed_kmh": telemetry.average_speed_kmh,
        "occupancy_rate_percent": telemetry.occupancy_rate_percent,
        "timestamp": telemetry.timestamp.isoformat(),
    }

  def update_signal_state(
      self,
      sensor_id: str,
      corridor_name: str,
      jurisdiction: str,
      state: str,
      green_sec: int,
      coordination_group: str,
      override: bool = False,
  ) -> TrafficSignalStateModel:
    signal = (
        self.db.query(TrafficSignalStateModel)
        .filter(TrafficSignalStateModel.sensor_id == sensor_id)
        .first()
    )

    if not signal:
      signal = TrafficSignalStateModel(
          sensor_id=sensor_id,
          corridor_name=corridor_name,
          jurisdiction=jurisdiction,
          traffic_state=state,
          recommended_green_sec=green_sec,
          signal_phase_override=override,
          coordination_group=coordination_group,
      )
      self.db.add(signal)
    else:
      signal.traffic_state = state
      signal.recommended_green_sec = green_sec
      signal.signal_phase_override = override
      signal.last_updated = datetime.utcnow()

    self.db.commit()
    self.db.refresh(signal)
    return signal

  def trigger_emergency_green_wave(
      self,
      unit_id: str,
      corridor_name: str,
      agency: AgencyType,
      gps_coords: Dict[str, float],
      speed: float,
      destination: str,
  ) -> Dict[str, Any]:
    # Record emergency dispatch log
    dispatch_log = EmergencyDispatchLogModel(
        unit_id=unit_id,
        agency=agency,
        active_emergency=True,
        current_gps=gps_coords,
        speed_kmh=speed,
        destination_hospital=destination,
        active_overrides_count=3,
        overrides_json={
            "corridor": corridor_name,
            "priority": "PREEMPTIVE_GREEN",
        },
    )
    self.db.add(dispatch_log)

    # Force signal overrides on matching corridor
    signals = (
        self.db.query(TrafficSignalStateModel)
        .filter(TrafficSignalStateModel.corridor_name == corridor_name)
        .all()
    )

    for signal in signals:
      signal.traffic_state = "GREEN_WAVE_PRIORITY"
      signal.recommended_green_sec = 120
      signal.signal_phase_override = True

    self.db.commit()

    return {
        "dispatch_id": dispatch_log.id,
        "corridor": corridor_name,
        "status": "GREEN_WAVE_ACTIVATED",
        "signals_overridden": len(signals),
    }