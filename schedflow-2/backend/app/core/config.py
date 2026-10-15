from functools import lru_cache

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Application settings, overridable via environment variables / .env."""

    APP_NAME: str = "SchedFlow"
    # Docker default points at the "db" service; override locally as needed.
    DATABASE_URL: str = "mysql+pymysql://schedflow:schedflow@db:3306/schedflow?charset=utf8mb4"
    SECRET_KEY: str = "change-me-in-production-9f2c1b7a4e8d"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 12
    CORS_ORIGINS: str = "http://localhost:5173,http://localhost:3000"
    ADMIN_EMAIL: str = "admin@schedflow.edu"
    ADMIN_PASSWORD: str = "admin123"

    # SMTP for substitution emails — leave HOST empty to disable sending
    SMTP_HOST: str = ""
    SMTP_PORT: int = 587
    SMTP_USER: str = ""
    SMTP_PASSWORD: str = ""
    EMAIL_FROM: str = "schedflow@college.edu"

    class Config:
        env_file = ".env"

    @property
    def cors_origin_list(self) -> list[str]:
        return [o.strip() for o in self.CORS_ORIGINS.split(",") if o.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()
