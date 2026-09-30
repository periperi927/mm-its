import pytest


def test_create_ticket_success(client):
  # First register and login an enforcer to get an auth token
  register_payload = {
      "username": "enforcer_qc_01",
      "email": "qc_enforcer@qc.gov.ph",
      "password": "Password123!",
      "agency": "LGU_QC",
      "role": "ENFORCER",
  }
  client.post("/api/v1/auth/register", json=register_payload)

  login_resp = client.post(
      "/api/v1/auth/login",
      data={"username": "enforcer_qc_01", "password": "Password123!"},
  )
  token = login_resp.json()["access_token"]
  headers = {"Authorization": f"Bearer {token}"}

  ticket_payload = {
      "driver_license_no": "N01-12-345678",
      "vehicle_plate_no": "ABC-1234",
      "violation_code": "STS-101",
      "fine_amount": 2000.00,
      "issuing_agency": "LGU_QC",
      "enforcer_id": "ENF-8842",
      "location_gps": {"lat": 14.5869, "lng": 121.0614},
      "demerit_points_added": 2,
  }

  response = client.post(
      "/api/v1/tickets", json=ticket_payload, headers=headers
  )
  assert response.status_code == 201
  data = response.json()
  assert data["driver_license_no"] == "N01-12-345678"
  assert data["status"] == "ISSUED"
  assert "id" in data


def test_get_driver_tickets_success(client):
  # Login
  register_payload = {
      "username": "lto_officer",
      "email": "officer@lto.gov.ph",
      "password": "Password123!",
      "agency": "LTO",
      "role": "OFFICER",
  }
  client.post("/api/v1/auth/register", json=register_payload)

  login_resp = client.post(
      "/api/v1/auth/login",
      data={"username": "lto_officer", "password": "Password123!"},
  )
  token = login_resp.json()["access_token"]
  headers = {"Authorization": f"Bearer {token}"}

  # Query tickets for a specific driver
  response = client.get(
      "/api/v1/tickets/driver/N01-12-345678", headers=headers
  )
  assert response.status_code == 200
  assert isinstance(response.json(), list)


def test_pay_ticket_not_found(client):
  register_payload = {
      "username": "payment_operator",
      "email": "payment_operator@mmda.gov.ph",
      "password": "Password123!",
  }
  client.post("/api/v1/auth/register", json=register_payload)
  login_response = client.post(
      "/api/v1/auth/login",
      data={"username": "payment_operator", "password": "Password123!"},
  )
  token = login_response.json()["access_token"]
  payment_payload = {"payment_reference": "PAY-2026-00001"}
  response = client.post(
      "/api/v1/tickets/NON_EXISTENT_ID/pay",
      json=payment_payload,
      headers={"Authorization": f"Bearer {token}"},
  )
  assert response.status_code == 404