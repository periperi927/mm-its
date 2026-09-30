from sqlalchemy import Column, String, Float, Integer, Boolean, DateTime, Enum, ForeignKey, JSON
from sqlalchemy.orm import relationship
from datetime import datetime
import enum
import uuid

from app.db.session import Base
from app.models.schemas import TicketStatus, AgencyType

class ViolationCitationModel(Base):
    __tablename__ = "violation_citations"

    id = Column(String, primary_key=True, default=lambda: f"TICKET-{uuid.uuid4().hex[:8].upper()}")
    driver_license_no = Column(String(20), nullable=False, index=True)
    vehicle_plate_no = Column(String(15), nullable=False, index=True)
    violation_code = Column(String(50), nullable=False)
    fine_amount = Column(Float, nullable=False)
    issuing_agency = Column(Enum(AgencyType), nullable=False)
    enforcer_id = Column(String(50), nullable=False)
    location_gps = Column(JSON, nullable=False)  # Stores {"lat": float, "lng": float}
    issued_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    status = Column(Enum(TicketStatus), default=TicketStatus.ISSUED, nullable=False)
    demerit_points_added = Column(Integer, default=0, nullable=False)
    lto_synced = Column(Boolean, default=False, nullable=False)
    payment_reference = Column(String(100), nullable=True)
    paid_at = Column(DateTime, nullable=True)


class SensorTelemetryModel(Base):
    __tablename__ = "sensor_telemetry_logs"

    id = Column(String, primary_key=True, default=lambda: f"TEL-{uuid.uuid4().hex[:10].upper()}")
    sensor_id = Column(String(50), nullable=False, index=True)
    corridor_name = Column(String(100), nullable=False, index=True)
    lgu_jurisdiction = Column(Enum(AgencyType), nullable=False)
    vehicle_count_per_min = Column(Integer, nullable=False)
    average_speed_kmh = Column(Float, nullable=False)
    occupancy_rate_percent = Column(Float, nullable=False)
    timestamp = Column(DateTime, default=datetime.utcnow, nullable=False)


class TrafficSignalStateModel(Base):
    __tablename__ = "traffic_signal_states"

    sensor_id = Column(String(50), primary_key=True)
    corridor_name = Column(String(100), nullable=False, index=True)
    jurisdiction = Column(String(50), nullable=False)
    traffic_state = Column(String(50), nullable=False)
    recommended_green_sec = Column(Integer, nullable=False)
    signal_phase_override = Column(Boolean, default=False)
    coordination_group = Column(String(100), nullable=False)
    last_updated = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class EmergencyDispatchLogModel(Base):
    __tablename__ = "emergency_dispatch_logs"

    id = Column(String, primary_key=True, default=lambda: f"EMG-{uuid.uuid4().hex[:10].upper()}")
    unit_id = Column(String(50), nullable=False, index=True)
    agency = Column(Enum(AgencyType), nullable=False)
    active_emergency = Column(Boolean, default=True)
    current_gps = Column(JSON, nullable=False)
    speed_kmh = Column(Float, nullable=False)
    destination_hospital = Column(String(150), nullable=True)
    active_overrides_count = Column(Integer, default=0)
    overrides_json = Column(JSON, nullable=True)
    timestamp = Column(DateTime, default=datetime.utcnow, nullable=False)


class User(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    username = Column(String(50), unique=True, index=True, nullable=False)
    email = Column(String(100), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(100), nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)