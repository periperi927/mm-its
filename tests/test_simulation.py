import pytest
from unittest.mock import MagicMock
from fastapi.testclient import TestClient

from app.main import app
from app.db.session import get_db

client = TestClient(app)


# --- Fixtures ---
@pytest.fixture
def mock_db_session():
    """Mock database session to isolate unit tests from actual database operations."""
    return MagicMock()


@pytest.fixture
def auth_headers(client):
    """Utility fixture to generate authorization headers for authenticated endpoints."""
    # Register test user
    register_payload = {
        "username": "sim_tester",
        "email": "sim_tester@mmda.gov.ph",
        "password": "Password123!",
        "full_name": "Simulation Tester",
    }
    client.post("/api/v1/auth/register", json=register_payload)

    # Login to retrieve token
    login_data = {"username": "sim_tester", "password": "Password123!"}
    response = client.post("/api/v1/auth/login", data=login_data)
    token = response.json().get("access_token")

    return {"Authorization": f"Bearer {token}"}


# --- Simulation & Signal Control Unit Tests ---
def test_submit_telemetry_success(client, auth_headers):
    """Test successful telemetry ingestion via POST /api/v1/traffic/telemetry."""
    telemetry_payload = {
        "sensor_id": "SENSOR-EDSA-001",
        "corridor_name": "EDSA-Cubao",
        "lgu_jurisdiction": "LGU_QC",
        "vehicle_count_per_min": 145,
        "average_speed_kmh": 22.5,
        "occupancy_rate_percent": 78.4,
    }

    response = client.post(
        "/api/v1/traffic/telemetry", json=telemetry_payload, headers=auth_headers
    )

    assert response.status_code == 201
    data = response.json()
    assert data["sensor_id"] == "SENSOR-EDSA-001"
    assert data["corridor_name"] == "EDSA-Cubao"


def test_submit_telemetry_unauthorized(client):
    """Test telemetry ingestion fails without JWT auth token."""
    telemetry_payload = {
        "sensor_id": "SENSOR-EDSA-001",
        "corridor_name": "EDSA-Cubao",
        "lgu_jurisdiction": "LGU_QC",
        "vehicle_count_per_min": 100,
        "average_speed_kmh": 30.0,
        "occupancy_rate_percent": 50.0,
    }

    response = client.post("/api/v1/traffic/telemetry", json=telemetry_payload)
    assert response.status_code == 401


def test_update_signal_state_success(client, auth_headers):
    """Test updating signal state via PUT /api/v1/traffic/signal-state."""
    signal_payload = {
        "sensor_id": "SENSOR-EDSA-001",
        "corridor_name": "EDSA-Cubao",
        "jurisdiction": "LGU_QC",
        "traffic_state": "HEAVY_CONGESTION",
        "recommended_green_sec": 90,
        "coordination_group": "GREEN_WAVE_ALPHA",
        "signal_phase_override": False,
    }

    response = client.put(
        "/api/v1/traffic/signal-state", json=signal_payload, headers=auth_headers
    )

    assert response.status_code == 200
    data = response.json()
    assert data["traffic_state"] == "HEAVY_CONGESTION"
    assert data["recommended_green_sec"] == 90


def test_health_check_endpoint(client):
    """Test public health check endpoint."""
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ONLINE"
    assert data["database"] == "CONNECTED"