import pytest
from fastapi.testclient import TestClient
from main import app


@pytest.mark.integration
def test_protected_routes_require_api_key():
    client = TestClient(app)

    response = client.get("/recipes/")

    assert response.status_code == 401
    payload = response.json()
    assert payload["code"] == "unauthorized"
