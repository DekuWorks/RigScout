from fastapi.testclient import TestClient

from src.main import app
from src.services import catalog_store
from src.services.catalog_store import CatalogSnapshot
from src.services.demo_catalog import list_products as list_fixture_products

client = TestClient(app)


def test_products_search_returns_empty_without_supabase_catalog() -> None:
    catalog_store.clear_catalog_cache()
    response = client.get("/v1/products")
    assert response.status_code == 200
    data = response.json()
    assert data["total"] == 0
    assert data["items"] == []
    assert data["is_mock"] is False
    assert data["source"] in {"empty", "supabase"}


def test_products_filter_returns_empty_when_unseeded() -> None:
    catalog_store.clear_catalog_cache()
    response = client.get("/v1/products", params={"category": "gpu"})
    assert response.status_code == 200
    data = response.json()
    assert data["total"] == 0
    assert data["items"] == []


def test_product_detail_404_when_unseeded() -> None:
    catalog_store.clear_catalog_cache()
    response = client.get("/v1/products/nvidia-rtx-4070-super")
    assert response.status_code == 404


def test_deals_endpoint_empty_when_unseeded() -> None:
    catalog_store.clear_catalog_cache()
    response = client.get("/v1/deals")
    assert response.status_code == 200
    data = response.json()
    assert data["trending"] == []
    assert data["largest_drops"] == []
    assert data["best_deal_scores"] == []
    assert data["is_mock"] is False


def test_empty_catalog_when_supabase_empty(monkeypatch) -> None:  # type: ignore[no-untyped-def]
    catalog_store.clear_catalog_cache()
    monkeypatch.setattr(
        "src.services.catalog_store.load_products_from_supabase",
        lambda _settings: None,
    )
    monkeypatch.setattr(
        "src.services.catalog_store.get_settings",
        lambda: type("S", (), {"supabase_configured": True})(),
    )
    snapshot = catalog_store.get_catalog_snapshot()
    assert snapshot.source == "supabase"
    assert snapshot.is_mock is False
    assert snapshot.products == []

    response = client.get("/v1/products")
    assert response.status_code == 200
    data = response.json()
    assert data["is_mock"] is False
    assert data["source"] == "supabase"
    assert data["total"] == 0


def test_supabase_source_flag_when_seeded(monkeypatch) -> None:  # type: ignore[no-untyped-def]
    fixtures = list_fixture_products()
    snapshot = CatalogSnapshot(products=fixtures, is_mock=False, source="supabase")
    monkeypatch.setattr("src.routers.catalog.get_catalog_snapshot", lambda _settings=None: snapshot)
    monkeypatch.setattr(
        "src.routers.catalog.list_catalog_products",
        lambda _settings=None: list(fixtures),
    )

    def _get_product(slug_or_id: str, _settings=None):  # type: ignore[no-untyped-def]
        for product in fixtures:
            if product.slug == slug_or_id or product.id == slug_or_id:
                return product
        return None

    monkeypatch.setattr("src.routers.catalog.get_catalog_product", _get_product)
    response = client.get("/v1/products")
    assert response.status_code == 200
    data = response.json()
    assert data["is_mock"] is False
    assert data["source"] == "supabase"
    assert data["total"] >= 1


def test_product_detail_from_injected_snapshot(monkeypatch) -> None:  # type: ignore[no-untyped-def]
    fixtures = list_fixture_products()
    snapshot = CatalogSnapshot(products=fixtures, is_mock=False, source="supabase")

    def _get_product(slug_or_id: str, _settings=None):  # type: ignore[no-untyped-def]
        for product in fixtures:
            if product.slug == slug_or_id or product.id == slug_or_id:
                return product
        return None

    monkeypatch.setattr("src.routers.catalog.get_catalog_snapshot", lambda _settings=None: snapshot)
    monkeypatch.setattr("src.routers.catalog.get_catalog_product", _get_product)
    monkeypatch.setattr(
        "src.routers.catalog.list_catalog_products",
        lambda _settings=None: list(fixtures),
    )
    response = client.get("/v1/products/nvidia-rtx-4070-super")
    assert response.status_code == 200
    data = response.json()
    assert data["listings"]
    assert data["source"] == "supabase"
    assert "affiliate_disclosure" in data
