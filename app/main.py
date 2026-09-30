import os
import logging
from datetime import datetime
from contextlib import asynccontextmanager
from urllib.parse import urlsplit

from fastapi import Depends, FastAPI, HTTPException, Request, WebSocket, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware
from slowapi.util import get_remote_address
from jose import JWTError, jwt

from app.api import auth, emergency, sts_tickets, traffic_signals, lto
from app.config import settings
from app.core.security import get_password_hash
from app.db.session import Base, SessionLocal, engine, get_db
from app.models.db_models import User
from app.core.rabbitmq import rabbitmq  # Import RabbitMQ manager instance

IS_PRODUCTION = settings.MMITS_ENVIRONMENT.lower() == "production"
logger = logging.getLogger(__name__)
cors_origins = settings.CORS_ORIGINS or settings.FRONTEND_URL
allowed_origins = [
    origin.strip().rstrip("/")
    for origin in cors_origins.split(",")
    if origin.strip()
]
if IS_PRODUCTION:
    if len(settings.SECRET_KEY) < 32 or settings.SECRET_KEY == "development-only-secret-change-before-deploy":
        raise RuntimeError("Production requires a unique SECRET_KEY of at least 32 characters.")
    if not settings.BOOTSTRAP_ADMIN_EMAIL or not settings.BOOTSTRAP_ADMIN_PASSWORD:
        raise RuntimeError("Production requires BOOTSTRAP_ADMIN_EMAIL and BOOTSTRAP_ADMIN_PASSWORD.")
    if len(settings.BOOTSTRAP_ADMIN_PASSWORD) < 12:
        raise RuntimeError("BOOTSTRAP_ADMIN_PASSWORD must be at least 12 characters.")
    for name, value in (
        ("FRONTEND_URL", settings.FRONTEND_URL),
        ("API_PUBLIC_URL", settings.API_PUBLIC_URL),
    ):
        parsed_url = urlsplit(value or "")
        if parsed_url.scheme != "https" or not parsed_url.netloc or parsed_url.path not in ("", "/"):
            raise RuntimeError(f"Production requires {name} to be an HTTPS origin.")

    if settings.CORS_ORIGINS and "*" in settings.CORS_ORIGINS:
        raise RuntimeError("Production CORS_ORIGINS cannot contain a wildcard.")
    if any(
        urlsplit(origin).scheme != "https"
        or not urlsplit(origin).netloc
        or urlsplit(origin).path not in ("", "/")
        for origin in allowed_origins
    ):
        raise RuntimeError("Production CORS origins must be HTTPS origins.")

# Create database tables
Base.metadata.create_all(bind=engine)

# Check if running under pytest
TESTING = os.getenv("TESTING", "false").lower() == "true"

# Disable rate limiting during tests
limiter = Limiter(
    key_func=get_remote_address, default_limits=["200/day"], enabled=not TESTING
)

# OpenAPI Tags Metadata
tags_metadata = [
    {
        "name": "System Status",
        "description": "Health checks and operational status indicators.",
    },
    {
        "name": "Authentication",
        "description": (
            "User registration, login, and JWT token management across agencies."
        ),
    },
    {
        "name": "LTO Driver Verification",
        "description": (
            "Land Transportation Office (LTO) driver license lookup and vehicle registration query."
        ),
    },
    {
        "name": "Single Ticketing System (STS)",
        "description": (
            "Unified traffic violation ticketing, LTO synchronization, and payment processing."
        ),
    },
    {
        "name": "Traffic Signals & Telemetry",
        "description": (
            "Real-time corridor telemetry, traffic state monitoring, and signal phase adjustments."
        ),
    },
    {
        "name": "Emergency Dispatch",
        "description": (
            "Priority emergency dispatch routing and signal preemption."
        ),
    },
]


# --- RabbitMQ Lifespan Context Manager ---
@asynccontextmanager
async def lifespan(app: FastAPI):
    if IS_PRODUCTION:
        ensure_bootstrap_admin()

    # Startup: Connect to RabbitMQ broker
    try:
        await rabbitmq.connect()
        app.state.rabbitmq = rabbitmq
        print(" [✓] Successfully connected to RabbitMQ Message Broker.")
    except Exception as e:
        print(f" [!] RabbitMQ Connection Failed: {e}")
        app.state.rabbitmq = None
    
    yield  # Application runs here
    
    # Shutdown: Close RabbitMQ connections
    if app.state.rabbitmq:
        await rabbitmq.close()
        print(" [✓] RabbitMQ connection closed.")


def ensure_bootstrap_admin() -> None:
    with SessionLocal() as db:
        admin = db.query(User).filter(
            User.username == settings.BOOTSTRAP_ADMIN_USERNAME
        ).first()
        if admin:
            return

        email_in_use = db.query(User).filter(
            User.email == settings.BOOTSTRAP_ADMIN_EMAIL
        ).first()
        if email_in_use:
            raise RuntimeError("BOOTSTRAP_ADMIN_EMAIL is already assigned to another account.")

        db.add(User(
            username=settings.BOOTSTRAP_ADMIN_USERNAME,
            email=settings.BOOTSTRAP_ADMIN_EMAIL,
            hashed_password=get_password_hash(settings.BOOTSTRAP_ADMIN_PASSWORD),
            full_name="MM-ITS Administrator",
            is_active=True,
        ))
        db.commit()
        print(" [✓] Bootstrap administrator account created.")


# --- FastAPI Application Initialization ---
app = FastAPI(
    title="Metro Manila Intelligent Transport System (MM-ITS)",
    description="""
    ### Multi-Agency Interoperability API Hub
    
    Powers real-time coordination across **MMDA, Local Government Units (LGUs), LTO LTMS, and Emergency Dispatch Services**.
    
    * **Authentication**: OAuth2 Password Bearer Tokens
    * **Jurisdictions**: MMDA, LGU QC, LGU Pasig, LGU Makati, LTO, Emergency 911
    """,
    version="1.0.0",
    terms_of_service="https://mmda.gov.ph/terms/",
    contact={
        "name": "MMDA ITS Technical Support",
        "url": "https://mmda.gov.ph/support",
        "email": "its-support@mmda.gov.ph",
    },
    license_info={
        "name": "Government Open Data License",
        "url": "https://mmda.gov.ph/licenses/open-data",
    },
    openapi_tags=tags_metadata,
    docs_url=None if IS_PRODUCTION else "/docs",
    redoc_url=None if IS_PRODUCTION else "/redoc",
    openapi_url=None if IS_PRODUCTION else "/openapi.json",
    swagger_ui_parameters={
        "defaultModelsExpandDepth": -1,
        "docExpansion": "list",
        "filter": True,
        "displayRequestDuration": True,
    },
    lifespan=lifespan,  # Attach lifespan handler for RabbitMQ
)

# Register Limiter on App State
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
app.add_middleware(SlowAPIMiddleware)

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.middleware("http")
async def add_security_headers(request: Request, call_next):
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Strict-Transport-Security"] = (
        "max-age=31536000; includeSubDomains"
    )
    
    api_origin = settings.API_PUBLIC_URL.rstrip("/") if settings.API_PUBLIC_URL else ""
    response.headers["Content-Security-Policy"] = (
        "default-src 'self'; "
        "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net; "
        "style-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net https://fonts.googleapis.com; "
        "img-src 'self' data: https://fastapi.tiangolo.com; "
        "font-src 'self' https://fonts.gstatic.com; "
        f"connect-src 'self' ws: wss: {api_origin} https://cdn.jsdelivr.net;"
    )
    return response


# Include Routers
app.include_router(auth.router)
app.include_router(sts_tickets.router)
app.include_router(traffic_signals.router)
app.include_router(emergency.router)
app.include_router(lto.router)


@app.websocket("/ws/signals")
async def websocket_endpoint(websocket: WebSocket):
    origin = websocket.headers.get("origin", "").rstrip("/")
    if IS_PRODUCTION and origin not in allowed_origins:
        await websocket.close(code=1008)
        return

    token = websocket.query_params.get("token")
    if not token:
        await websocket.close(code=1008)
        return

    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        username = payload.get("sub")
        with SessionLocal() as db:
            user = db.query(User).filter(User.username == username).first()
            if user is None or not user.is_active:
                await websocket.close(code=1008)
                return
    except (JWTError, TypeError):
        await websocket.close(code=1008)
        return

    await websocket.accept()
    while True:
        data = await websocket.receive_text()
        await websocket.send_text(f"Signal stream active: {data}")


@app.get("/health", tags=["System Status"])
def health_check(request: Request, db: Session = Depends(get_db)):
    try:
        db.execute(text("SELECT 1"))
    except SQLAlchemyError as error:
        logger.exception("Database health check failed.")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database unavailable.",
        ) from error

    rabbitmq_status = "CONNECTED" if getattr(request.app.state, "rabbitmq", None) else "DISCONNECTED"
    return {
        "system": "Metro Manila Intelligent Transport System (MM-ITS)",
        "status": "ONLINE",
        "database": "CONNECTED",
        "rabbitmq": rabbitmq_status,
        "timestamp": datetime.utcnow(),
    }


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)