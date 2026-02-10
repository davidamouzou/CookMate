import pytest
from fastapi.testclient import TestClient

from main import app
from routers import recipes as recipes_router


class FakeResponse:
    def __init__(self, data):
        self.data = data


class FakeTable:
    def __init__(self, data):
        self._data = data
        self.last_eq = None

    def select(self, _):
        return self

    def eq(self, key, value):
        self.last_eq = (key, value)
        return self

    def execute(self):
        return FakeResponse(self._data)


@pytest.mark.integration
def test_get_recipe_detail_returns_payload(monkeypatch):
    fake = FakeTable([{"id": 42, "recipe_name": "Pasta"}])
    monkeypatch.setattr(recipes_router, "recipe_table", fake)

    client = TestClient(app)
    response = client.get("/recipes/42", headers={"api-key": "test-key"})

    assert response.status_code == 200
    assert response.json() == {"id": 42, "recipe_name": "Pasta"}
    assert fake.last_eq == ("id", 42)
