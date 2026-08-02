from fastapi.testclient import TestClient

from src.main import app
from src.services import catalog_store
from src.services.catalog_store import CatalogSnapshot
from src.services.demo_catalog import list_products as list_demo_products

client = TestClient(app)


def test_products_search_returns_catalog() -> None:
    catalog_store.clear_catalog_cache()
    response = client.get("/v1/products")
    assert response.status_code == 200
    data = response.json()
    assert data["total"] >= 1
    assert data["source"] in {"demo_catalog", "supabase"}
    assert "deal_score" in data["items"][0]
    assert "is_mock" in data


def test_products_filter_by_category() -> None:
    catalog_store.clear_catalog_cache()
    response = client.get("/v1/products", params={"category": "gpu"})
    assert response.status_code == 200
    data = response.json()
    assert data["total"] >= 1
    assert all(item["category"] == "gpu" for item in data["items"])


def test_product_detail_includes_history() -> None:
    catalog_store.clear_catalog_cache()
    response = client.get("/v1/products/nvidia-rtx-4070-super")
    assert response.status_code == 200
    data = response.json()
    assert len(data["price_history"]) >= 1
    assert data["listings"]
    assert "affiliate_disclosure" in data
    assert data["source"] in {"demo_catalog", "supabase"}


def test_deals_endpoint() -> None:
    catalog_store.clear_catalog_cache()
    response = client.get("/v1/deals")
    assert response.status_code == 200
    data = response.json()
    assert data["trending"]
    assert data["largest_drops"]
    assert data["best_deal_scores"]


def test_demo_fallback_when_supabase_empty(monkeypatch) -> None:  # type: ignore[no-untyped-def]
    catalog_store.clear_catalog_cache()
    monkeypatch.setattr(
        "src.services.catalog_store.load_products_from_supabase",
        lambda _settings: None,
    )
    snapshot = catalog_store.get_catalog_snapshot()
    assert snapshot.source == "demo_catalog"
    assert snapshot.is_mock is True
    assert len(snapshot.products) == len(list_demo_products())

    response = client.get("/v1/products")
    assert response.status_code == 200
    data = response.json()
    assert data["is_mock"] is True
    assert data["source"] == "demo_catalog"
    assert data["total"] >= 8


def test_supabase_source_flag_when_seeded(monkeypatch) -> None:  # type: ignore[no-untyped-def]
    demo = list_demo_products()
    snapshot = CatalogSnapshot(products=demo, is_mock=False, source="supabase")
    monkeypatch.setattr("src.routers.catalog.get_catalog_snapshot", lambda _settings=None: snapshot)
    monkeypatch.setattr("src.routers.catalog.get_catalog_product", catalog_store.get_catalog_product)
    monkeypatch.setattr(
        "src.routers.catalog.list_catalog_products",
        lambda _settings=None: list(demo),
    )
    # Ensure product lookups resolve against the seeded snapshot.
    monkeypatch.setattr(
        "src.services.catalog_store.get_catalog_snapshot",
        lambda settings=None: snapshot,
    )
    response = client.get("/v1/products")
    assert response.status_code == 200
    data = response.json()
    assert data["is_mock"] is False
    assert data["source"] == "supabase"
