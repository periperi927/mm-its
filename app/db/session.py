from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, DeclarativeBase
from app.config import settings

# Create SQLAlchemy Database Engine
engine = create_engine(
    settings.assemble_db_connection(),
    pool_pre_ping=True,
    pool_size=10,
    max_overflow=20
)

# Create Session Local Factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base class for ORM Models
class Base(DeclarativeBase):
    pass

# Dependency for FastAPI Endpoints
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()