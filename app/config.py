from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import Optional

class Settings(BaseSettings):
    PROJECT_NAME: str = "Metro Manila Intelligent Transport System (MM-ITS)"
    API_V1_STR: str = "/api/v1"
    SECRET_KEY: str = "development-only-secret-change-before-deploy"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 Hours
    MMITS_ENVIRONMENT: str = "development"
    ALLOW_PUBLIC_REGISTRATION: bool = False
    BOOTSTRAP_ADMIN_USERNAME: str = "admin"
    BOOTSTRAP_ADMIN_EMAIL: Optional[str] = None
    BOOTSTRAP_ADMIN_PASSWORD: Optional[str] = None
    FRONTEND_URL: str = "http://localhost:3000,http://127.0.0.1:3001"
    API_PUBLIC_URL: Optional[str] = None
    CORS_ORIGINS: Optional[str] = None

    # Database Settings
    POSTGRES_USER: str = "mmits_user"
    POSTGRES_PASSWORD: str = "mmits_secure_password"
    POSTGRES_SERVER: str = "localhost"
    POSTGRES_PORT: int = 5432
    POSTGRES_DB: str = "mmits_db"
    DATABASE_URL: Optional[str] = None
    RABBITMQ_URL: str = "amqp://guest:guest@localhost:5672/"

    model_config = SettingsConfigDict(env_file=".env", case_sensitive=True)

    def assemble_db_connection(self) -> str:
        if self.DATABASE_URL:
            return self.DATABASE_URL
        return (
            f"postgresql+psycopg2://{self.POSTGRES_USER}:"
            f"{self.POSTGRES_PASSWORD}@{self.POSTGRES_SERVER}:"
            f"{self.POSTGRES_PORT}/{self.POSTGRES_DB}"
        )

settings = Settings()