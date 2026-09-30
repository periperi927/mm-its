from app.models.schemas import SensorTelemetry, AgencyType
from typing import Dict, Any

class AdaptiveSignalAI:
    BASE_GREEN_TIME_SEC: int = 30
    MAX_GREEN_TIME_SEC: int = 90
    MIN_GREEN_TIME_SEC: int = 15

    @classmethod
    def calculate_adaptive_timing(cls, telemetry: SensorTelemetry) -> Dict[str, Any]:
        """
        Calculates cross-border signal adjustments based on vehicle volume,
        average speed, and corridor occupancy rate.
        """
        occupancy = telemetry.occupancy_rate_percent
        avg_speed = telemetry.average_speed_kmh
        vehicle_count = telemetry.vehicle_count_per_min

        # Base calculation ratio
        adjusted_green_time = cls.BASE_GREEN_TIME_SEC

        # High congestion rule: Heavy volume + low speed (< 20 km/h) + high occupancy (> 75%)
        if occupancy > 75.0 or avg_speed < 15.0:
            # Increase green light time dynamically
            congestion_factor = (occupancy / 100.0) * 1.5
            adjusted_green_time = int(cls.BASE_GREEN_TIME_SEC * (1 + congestion_factor))
            traffic_state = "CRITICAL_CONGESTION"
        elif occupancy < 30.0 and avg_speed > 40.0:
            # Low congestion: Reduce green time to allow cross-street discharge
            adjusted_green_time = cls.MIN_GREEN_TIME_SEC
            traffic_state = "FREE_FLOW"
        else:
            traffic_state = "MODERATE_FLOW"

        # Enforce hard boundaries
        final_green_time = max(cls.MIN_GREEN_TIME_SEC, min(cls.MAX_GREEN_TIME_SEC, adjusted_green_time))

        return {
            "sensor_id": telemetry.sensor_id,
            "corridor": telemetry.corridor_name,
            "jurisdiction": telemetry.lgu_jurisdiction,
            "traffic_state": traffic_state,
            "recommended_green_sec": final_green_time,
            "signal_phase_override": final_green_time != cls.BASE_GREEN_TIME_SEC,
            "coordination_group": cls._get_coordination_group(telemetry.corridor_name)
        }

    @staticmethod
    def _get_coordination_group(corridor_name: str) -> str:
        """
        Maps corridors to multi-LGU coordination zones.
        """
        if "C-5" in corridor_name:
            return "ZONE_C5_PASIG_QC"
        elif "EDSA" in corridor_name:
            return "ZONE_EDSA_MAKATI_MANDALUYONG_QC"
        return "ZONE_LOCAL_LGU"