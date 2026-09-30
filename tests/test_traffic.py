import uuid
import pytest

REGISTER_URL = "/api/v1/auth/register"
LOGIN_URL = "/api/v1/auth/login"
TELEMETRY_URL = "/api/v1/traffic/telemetry"
SIGNAL_STATE_URL = "/api/v1/traffic/signal-state"


def get_auth_headers(client):
  unique_user = f"traffic_op_{uuid.uuid4().hex[:6]}"
  user_data = {
      "username": unique_user,
      "email": f"{unique_user}@mmda.gov.ph",
      "password": "Password123!",
      "role": "TRAFFIC_OPERATOR",
  }
  client.post(REGISTER_URL, json=user_data)
  login_resp = client.post(
      LOGIN_URL,
      data={
          "username": user_data["username"],
          "password": user_data["password"],
      },
  )
  token = login_resp.json().get("access_token")
  return {"Authorization": f"Bearer {token}"}


def test_submit_telemetry_success(client):
  headers = get_auth_headers(client)
  payload = {
      "sensor_id": "SNSR-EDSA-01",
      "corridor_name": "EDSA Northbound",
      "lgu_jurisdiction": "LGU_QC",
      "vehicle_count_per_min": 45,
      "average_speed_kmh": 32.5,
      "occupancy_rate_percent": 68.0,
  }

  response = client.post(TELEMETRY_URL, json=payload, headers=headers)
  assert response.status_code in [200, 201]


def test_submit_telemetry_unauthorized(client):
  payload = {
      "sensor_id": "SNSR-EDSA-01",
      "corridor_name": "EDSA Northbound",
      "lgu_jurisdiction": "LGU_QC",
      "vehicle_count_per_min": 45,
      "average_speed_kmh": 32.5,
      "occupancy_rate_percent": 68.0,
  }

  response = client.post(TELEMETRY_URL, json=payload)
  assert response.status_code == 401


def test_update_signal_state_success(client):
  headers = get_auth_headers(client)
  payload = {
      "sensor_id": "SNSR-EDSA-01",
      "corridor_name": "EDSA Northbound",
      "jurisdiction": "LGU_QC",
      "traffic_state": "HEAVY",
      "recommended_green_sec": 90,
      "coordination_group": "CG-EDSA-01",
      "signal_phase_override": False,
  }

  response = client.put(SIGNAL_STATE_URL, json=payload, headers=headers)
  assert response.status_code in [200, 201]


def test_update_signal_state_unauthorized(client):
  payload = {
      "sensor_id": "SNSR-EDSA-01",
      "corridor_name": "EDSA Northbound",
      "jurisdiction": "LGU_QC",
      "traffic_state": "HEAVY",
      "recommended_green_sec": 90,
      "coordination_group": "CG-EDSA-01",
      "signal_phase_override": False,
  }

  response = client.put(SIGNAL_STATE_URL, json=payload)
  assert response.status_code == 401