import pytest

from app.config import settings


def test_public_registration_is_disabled_when_configured(client, monkeypatch):
  monkeypatch.setattr(settings, "ALLOW_PUBLIC_REGISTRATION", False)
  response = client.post(
      "/api/v1/auth/register",
      json={
          "username": "uninvited_member",
          "email": "uninvited@example.com",
          "password": "SecurePassword123!",
      },
  )
  assert response.status_code == 403


def test_member_management_requires_administrator(client):
  client.post(
      "/api/v1/auth/register",
      json={
          "username": "group_member",
          "email": "member@example.com",
          "password": "SecurePassword123!",
      },
  )
  login = client.post(
      "/api/v1/auth/login",
      data={"username": "group_member", "password": "SecurePassword123!"},
  )
  headers = {"Authorization": f"Bearer {login.json()['access_token']}"}

  assert client.get("/api/v1/auth/members").status_code == 401
  assert client.get("/api/v1/auth/members", headers=headers).status_code == 403


def test_register_user_success(client):
  payload = {
      "username": "enforcer_qc",
      "email": "enforcer@qc.gov.ph",
      "password": "SecurePassword123!",
      "agency": "LGU_QC",
      "role": "ENFORCER",
  }
  response = client.post("/api/v1/auth/register", json=payload)
  assert response.status_code in [200, 201]
  data = response.json()
  assert data["username"] == payload["username"]
  assert data["email"] == payload["email"]
  assert "id" in data


def test_register_duplicate_username_fails(client):
  payload = {
      "username": "mmda_admin",
      "email": "admin1@mmda.gov.ph",
      "password": "Password123!",
      "agency": "MMDA",
      "role": "ADMIN",
  }
  client.post("/api/v1/auth/register", json=payload)

  payload_duplicate = payload.copy()
  payload_duplicate["email"] = "admin2@mmda.gov.ph"
  response = client.post("/api/v1/auth/register", json=payload_duplicate)
  assert response.status_code == 400


def test_login_success(client):
  register_payload = {
      "username": "dispatch_officer",
      "email": "dispatch@mmda.gov.ph",
      "password": "Password123!",
      "agency": "EMERGENCY_911",
      "role": "DISPATCHER",
  }
  client.post("/api/v1/auth/register", json=register_payload)

  login_data = {"username": "dispatch_officer", "password": "Password123!"}
  response = client.post("/api/v1/auth/login", data=login_data)
  assert response.status_code == 200
  tokens = response.json()
  assert "access_token" in tokens
  assert tokens["token_type"] == "bearer"


def test_login_invalid_password_fails(client):
  register_payload = {
      "username": "lto_agent",
      "email": "agent@lto.gov.ph",
      "password": "CorrectPassword123!",
      "agency": "LTO",
      "role": "OFFICER",
  }
  client.post("/api/v1/auth/register", json=register_payload)

  login_data = {"username": "lto_agent", "password": "WrongPassword!"}
  response = client.post("/api/v1/auth/login", data=login_data)
  assert response.status_code == 401


def test_protected_route_without_token_fails(client):
  response = client.get("/api/v1/tickets/driver/N01-12-345678")
  assert response.status_code == 401


def test_protected_route_with_valid_token(client):
  register_payload = {
      "username": "traffic_controller",
      "email": "traffic@pasig.gov.ph",
      "password": "Password123!",
      "agency": "LGU_PASIG",
      "role": "OPERATOR",
  }
  client.post("/api/v1/auth/register", json=register_payload)

  login_response = client.post(
      "/api/v1/auth/login",
      data={"username": "traffic_controller", "password": "Password123!"},
  )
  token = login_response.json()["access_token"]

  headers = {"Authorization": f"Bearer {token}"}
  response = client.get(
      "/api/v1/tickets/driver/N01-12-345678", headers=headers
  )
  assert response.status_code == 200