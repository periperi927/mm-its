import pytest


def test_emergency_dispatch_request_success(client):
    # Register and login an emergency dispatch user
    register_payload = {
        "username": "dispatch_911",
        "email": "dispatch@911.gov.ph",
        "password": "Password123!",
        "agency": "EMERGENCY_911",
        "role": "DISPATCHER",
    }
    client.post("/api/v1/auth/register", json=register_payload)

    login_resp = client.post(
        "/api/v1/auth/login",
        data={"username": "dispatch_911", "password": "Password123!"},
    )
    token = login_resp.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    dispatch_payload = {
        "unit_id": "AMB-RED-CROSS-01",
        "agency": "EMERGENCY_911",
        "current_gps": {"lat": 14.5869, "lng": 121.0614},
        "speed_kmh": 65.0,
        "destination_hospital": "Medical City Ortigas",
        "corridor_name": "C-5 Road Northbound",
    }

    response = client.post(
        "/api/v1/emergency/dispatch", json=dispatch_payload, headers=headers
    )
    assert response.status_code in [200, 201]

    data = response.json()
    assert data["unit_id"] == "AMB-RED-CROSS-01"
    assert data["corridor_name"] == "C-5 Road Northbound"
    assert "dispatch_id" in data


def test_emergency_dispatch_unauthorized(client):
    dispatch_payload = {
        "unit_id": "AMB-RED-CROSS-01",
        "agency": "EMERGENCY_911",
        "current_gps": {"lat": 14.5869, "lng": 121.0614},
        "speed_kmh": 65.0,
        "destination_hospital": "Medical City Ortigas",
        "corridor_name": "C-5 Road Northbound",
    }
    response = client.post("/api/v1/emergency/dispatch", json=dispatch_payload)
    assert response.status_code == 401