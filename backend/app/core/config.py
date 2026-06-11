from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    APP_NAME: str = "EDUC FISICA API"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = False

    DATABASE_URL: str = "sqlite:///./educ_fisica.db"

    CORS_ORIGINS: list[str] = ["http://localhost:3000", "http://localhost:3001"]
    SECRET_KEY: str = "change-me-in-production"

    PORT: int = 8000


settings = Settings()
