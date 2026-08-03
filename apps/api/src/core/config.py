"""Environment configuration for the FastAPI service.

Service-role secrets stay here (server-only). Never send them to the frontend.
"""

from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=("../../.env", ".env"),
        env_file_encoding="utf-8",
        extra="ignore",
    )

    environment: str = "development"
    api_host: str = "0.0.0.0"
    api_port: int = 8000
    api_cors_origins: str = "http://localhost:5173,http://127.0.0.1:5173"
    api_rate_limit_per_minute: int = 60

    supabase_url: str = ""
    supabase_service_role_key: str = ""
    supabase_jwt_secret: str = ""

    smtp_host: str = ""
    smtp_port: int = 587
    smtp_user: str = ""
    smtp_password: str = ""
    smtp_from: str = "alerts@rigscout.co"

    # Shared secret for POST /v1/jobs/* — leave blank to disable job routes
    alert_job_token: str = ""

    # Official retailer APIs — leave blank until credentials are provisioned
    best_buy_api_key: str = ""

    # Amazon PA-API 5 (Associates). All three required for live Amazon sync.
    amazon_paapi_access_key: str = ""
    amazon_paapi_secret_key: str = ""
    amazon_paapi_partner_tag: str = ""

    # Newegg Marketplace seller credentials (do NOT unlock catalog search for RigScout)
    newegg_api_key: str = ""
    newegg_seller_id: str = ""

    # Manual/affiliate CSV or JSON feeds (local path or http(s) URL). See RETAILER_ADAPTERS.md.
    newegg_feed_path: str = ""
    microcenter_feed_path: str = ""

    @property
    def cors_origins(self) -> list[str]:
        return [o.strip() for o in self.api_cors_origins.split(",") if o.strip()]

    @property
    def supabase_configured(self) -> bool:
        return bool(self.supabase_url and self.supabase_service_role_key)

    @property
    def email_configured(self) -> bool:
        return bool(self.smtp_host and self.smtp_user and self.smtp_password)

    @property
    def jobs_enabled(self) -> bool:
        return bool(self.alert_job_token)

    @property
    def best_buy_configured(self) -> bool:
        return bool(self.best_buy_api_key.strip())

    @property
    def amazon_paapi_configured(self) -> bool:
        return bool(
            self.amazon_paapi_access_key.strip()
            and self.amazon_paapi_secret_key.strip()
            and self.amazon_paapi_partner_tag.strip()
        )

    @property
    def newegg_feed_configured(self) -> bool:
        return bool(self.newegg_feed_path.strip())

    @property
    def microcenter_feed_configured(self) -> bool:
        return bool(self.microcenter_feed_path.strip())


@lru_cache
def get_settings() -> Settings:
    return Settings()
