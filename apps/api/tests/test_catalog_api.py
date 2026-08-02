from fastapi.testclient import TestClient

from src.main import app

client = TestClient(app)


def test_products_search_returns_mock_catalog() -> None:
    response = client.get("/v1/products")
    assert response.status_code == 200
    data = response.json()
    assert data["is_mock"] is True
    assert data["total"] >= 8
    assert "deal_score" in data["items"][0]


def test_products_filter_by_category() -> None:
    response = client.get("/v1/products", params={"category": "gpu"})
    assert response.status_code == 200
    data = response.json()
    assert data["total"] >= 1
    assert all(item["category"] == "gpu" for item in data["items"])


def test_product_detail_includes_history() -> None:
    response = client.get("/v1/products/nvidia-rtx-4070-super")
    assert response.status_code == 200
    data = response.json()
    assert len(data["price_history"]) >= 30
    assert data["listings"]
    assert "affiliate_disclosure" in data


def test_deals_endpoint() -> None:
    response = client.get("/v1/deals")
    assert response.status_code == 200
    data = response.json()
    assert data["trending"]
    assert data["largest_drops"]
    assert data["best_deal_scores"]
