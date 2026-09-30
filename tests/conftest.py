import os
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

# Configure the app before importing modules that instantiate Settings.
os.environ["TESTING"] = "true"
os.environ["MMITS_ENVIRONMENT"] = "test"
os.environ["ALLOW_PUBLIC_REGISTRATION"] = "true"

from app.api.auth import limiter
from app.db.session import Base, get_db
from app.main import app

# Use an in-memory SQLite database for testing
SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(
    autocommit=False, autoflush=False, bind=engine
)


@pytest.fixture(autouse=True)
def disable_rate_limiter():
  """Automatically disable Slowapi rate limiting across app state and auth module for all test runs."""
  app.state.limiter.enabled = False
  limiter.enabled = False
  yield
  app.state.limiter.enabled = True
  limiter.enabled = True


@pytest.fixture(scope="function")
def db_session():
  """Create fresh database tables for each test and drop them afterward."""
  Base.metadata.create_all(bind=engine)
  session = TestingSessionLocal()
  try:
    yield session
  finally:
    session.close()
    Base.metadata.drop_all(bind=engine)


@pytest.fixture(scope="function")
def client(db_session):
  """Override the get_db dependency with the testing in-memory session."""

  def _override_get_db():
    try:
      yield db_session
    finally:
      pass

  app.dependency_overrides[get_db] = _override_get_db
  with TestClient(app) as test_client:
    yield test_client
  app.dependency_overrides.clear()