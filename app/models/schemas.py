from datetime import datetime
from enum import Enum
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, ConfigDict, Field


# --- ENUMS ---
class TicketStatus(str, Enum):
  ISSUED = "ISSUED"
  PENDING_PAYMENT = "PENDING_PAYMENT"
  PAID = "PAID"
  CANCELLED = "CANCELLED"


class ViolationCode(str, Enum):
  RECKLESS_DRIVING = "STS-101"
  OBSTRUCTING_TRAFFIC = "STS-102"
  DISREGARDING_TRAFFIC_SIGNALS = "STS-103"
  ILLEGAL_PARKING = "STS-104"


class AgencyType(str, Enum):
  MMDA = "MMDA"
  LGU_QUEZON_CITY = "LGU_QC"
  LGU_PASIG = "LGU_PASIG"
  LGU_MAKATI = "LGU_MAKATI"
  LTO = "LTO"
  EMERGENCY_DISPATCH = "EMERGENCY_911"


# --- GPS LOCATION MODEL ---
class GPSLocation(BaseModel):
  lat: float = Field(..., json_schema_extra={"example": 14.5869})
  lng: float = Field(..., json_schema_extra={"example": 121.0614})


# --- CITATION SCHEMAS ---
class CitationCreate(BaseModel):
  driver_license_no: str = Field(
      ..., json_schema_extra={"example": "N01-12-345678"}
  )
  vehicle_plate_no: str = Field(..., json_schema_extra={"example": "ABC-1234"})
  violation_code: str = Field(..., json_schema_extra={"example": "STS-101"})
  fine_amount: float = Field(..., json_schema_extra={"example": 2000.00})
  issuing_agency: AgencyType
  enforcer_id: str = Field(..., json_schema_extra={"example": "ENF-8842"})
  location_gps: GPSLocation
  demerit_points_added: int = Field(default=0, json_schema_extra={"example": 2})


class CitationResponse(BaseModel):
  model_config = ConfigDict(from_attributes=True)

  id: str
  driver_license_no: str
  vehicle_plate_no: str
  violation_code: str
  fine_amount: float
  issuing_agency: AgencyType
  enforcer_id: str
  location_gps: Dict[str, Any]
  issued_at: datetime
  status: TicketStatus
  demerit_points_added: int
  lto_synced: bool
  payment_reference: Optional[str] = None
  paid_at: Optional[datetime] = None


class PaymentRequest(BaseModel):
  payment_reference: str = Field(
      ..., json_schema_extra={"example": "PAY-2026-99812"}
  )


# --- TRAFFIC SENSOR SCHEMAS ---
class TelemetryData(BaseModel):
  sensor_id: str = Field(..., json_schema_extra={"example": "SNSR-C5-042"})
  corridor_name: str = Field(
      ..., json_schema_extra={"example": "C-5 Road Northbound"}
  )
  lgu_jurisdiction: AgencyType
  vehicle_count_per_min: int = Field(..., json_schema_extra={"example": 85})
  average_speed_kmh: float = Field(..., json_schema_extra={"example": 12.5})
  occupancy_rate_percent: float = Field(..., json_schema_extra={"example": 88.5})


class TelemetryResponse(BaseModel):
  model_config = ConfigDict(from_attributes=True)

  id: str
  sensor_id: str
  corridor_name: str
  lgu_jurisdiction: AgencyType
  vehicle_count_per_min: int
  average_speed_kmh: float
  occupancy_rate_percent: float
  timestamp: datetime


class SignalStateUpdate(BaseModel):
  sensor_id: str = Field(..., json_schema_extra={"example": "SNSR-C5-042"})
  corridor_name: str = Field(
      ..., json_schema_extra={"example": "C-5 Road Northbound"}
  )
  jurisdiction: str = Field(..., json_schema_extra={"example": "LGU_PASIG"})
  traffic_state: str = Field(..., json_schema_extra={"example": "GREEN"})
  recommended_green_sec: int = Field(..., json_schema_extra={"example": 45})
  coordination_group: str = Field(
      ..., json_schema_extra={"example": "CORRIDOR-C5-GRP1"}
  )
  signal_phase_override: bool = False


class SignalStateResponse(BaseModel):
  model_config = ConfigDict(from_attributes=True)

  sensor_id: str
  corridor_name: str
  jurisdiction: str
  traffic_state: str
  recommended_green_sec: int
  signal_phase_override: bool
  coordination_group: str
  last_updated: datetime


# --- EMERGENCY VEHICLE SCHEMAS ---
class EmergencyDispatchRequest(BaseModel):
  unit_id: str = Field(..., json_schema_extra={"example": "AMB-RED-CROSS-01"})
  agency: AgencyType
  current_gps: GPSLocation
  speed_kmh: float = Field(..., json_schema_extra={"example": 55.0})
  destination_hospital: Optional[str] = Field(
      None, json_schema_extra={"example": "Medical City Ortigas"}
  )
  corridor_name: str = Field(
      ..., json_schema_extra={"example": "C-5 Road Northbound"}
  )


class EmergencyDispatchResponse(BaseModel):
  dispatch_id: str
  unit_id: str
  corridor_name: str
  status: str
  overrides_applied: int