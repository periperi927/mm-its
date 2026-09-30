import os
from datetime import timedelta
from fastapi import APIRouter, Depends, HTTPException, Request, status
from fastapi.security import OAuth2PasswordRequestForm
from pydantic import BaseModel, ConfigDict, EmailStr, Field
from slowapi import Limiter
from slowapi.util import get_remote_address
from sqlalchemy.orm import Session

from app.config import settings
from app.core.security import (
    create_access_token,
    get_current_user,
    get_password_hash,
    verify_password,
)
from app.db.session import get_db
from app.models.db_models import User

# Check if running in pytest / test environment
IS_TESTING = (
    "PYTEST_CURRENT_TEST" in os.environ
    or os.getenv("TESTING", "false").lower() == "true"
)

# Initialize Limiter - explicitly set enabled=False during testing
limiter = Limiter(key_func=get_remote_address, enabled=not IS_TESTING)

router = APIRouter(prefix="/api/v1/auth", tags=["Authentication"])


# --- Schemas ---
class UserRegister(BaseModel):
  username: str
  email: EmailStr
  password: str = Field(min_length=12, max_length=72)
  full_name: str | None = None


class MemberCreate(UserRegister):
  pass


class MemberActivation(BaseModel):
  is_active: bool


class TokenResponse(BaseModel):
  access_token: str
  token_type: str = "bearer"


class UserResponse(BaseModel):
  id: str
  username: str
  email: str
  full_name: str | None = None
  is_active: bool

  model_config = ConfigDict(from_attributes=True)


def require_admin(current_user: dict) -> None:
  if current_user.get("username") != settings.BOOTSTRAP_ADMIN_USERNAME:
    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail="Administrator access is required.",
    )


# --- Endpoints ---
@router.post(
    "/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED
)
@limiter.limit("5/minute")
def register_user(
    request: Request, user_in: UserRegister, db: Session = Depends(get_db)
):
  """Allow open account creation only when explicitly enabled for development."""
  if not settings.ALLOW_PUBLIC_REGISTRATION:
    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail="Public registration is disabled. Ask your MM-ITS administrator for an account.",
    )

  return _create_user(user_in, db)


def _create_user(user_in: UserRegister, db: Session) -> User:
  # Check if username or email already exists
  existing_user = (
      db.query(User)
      .filter(
          (User.username == user_in.username) | (User.email == user_in.email)
      )
      .first()
  )

  if existing_user:
    raise HTTPException(
        status_code=status.HTTP_400_BAD_REQUEST,
        detail="Username or email already registered.",
    )

  # Hash the password and persist user
  hashed_pwd = get_password_hash(user_in.password)
  new_user = User(
      username=user_in.username,
      email=user_in.email,
      hashed_password=hashed_pwd,
      full_name=user_in.full_name,
      is_active=True,
  )
  db.add(new_user)
  db.commit()
  db.refresh(new_user)
  return new_user


@router.get("/members", response_model=list[UserResponse])
def list_members(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
  require_admin(current_user)
  return db.query(User).order_by(User.username).all()


@router.post("/members", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
@limiter.limit("10/minute")
def create_member(
    request: Request,
    member_in: MemberCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
  require_admin(current_user)
  return _create_user(member_in, db)


@router.patch("/members/{username}", response_model=UserResponse)
def update_member_status(
    username: str,
    activation: MemberActivation,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
  require_admin(current_user)
  if username == settings.BOOTSTRAP_ADMIN_USERNAME:
    raise HTTPException(
        status_code=status.HTTP_400_BAD_REQUEST,
        detail="The bootstrap administrator cannot be disabled here.",
    )

  member = db.query(User).filter(User.username == username).first()
  if member is None:
    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Member not found.")

  member.is_active = activation.is_active
  db.commit()
  db.refresh(member)
  return member


@router.post("/login", response_model=TokenResponse)
@limiter.limit("10/minute")
def login_for_access_token(
    request: Request,
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db),
):
  """OAuth2 compatible token login with rate limiting (10 req/min).

  Accepts username and password form fields. Returns a JWT access token upon
  successful authentication.
  """
  user = db.query(User).filter(User.username == form_data.username).first()

  if not user or not verify_password(form_data.password, user.hashed_password):
    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Incorrect username or password",
        headers={"WWW-Authenticate": "Bearer"},
    )

  if not user.is_active:
    raise HTTPException(
        status_code=status.HTTP_400_BAD_REQUEST, detail="Inactive user account."
    )

  # Issue JWT token
  access_token_expires = timedelta(
      minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES
  )
  access_token = create_access_token(
      subject=user.username, expires_delta=access_token_expires
  )

  return {"access_token": access_token, "token_type": "bearer"}