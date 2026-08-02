from fastapi.testclient import TestClient

from src.main import app

client = TestClient(app)


def test_account_export_requires_auth() -> None:
    response = client.get("/v1/account/export")
    assert response.status_code == 401


def test_account_delete_requires_auth() -> None:
    response = client.delete("/v1/account")
    assert response.status_code == 401
