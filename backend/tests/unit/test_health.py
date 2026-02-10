import os

os.environ.setdefault("SUPABASE_URL", "https://example.supabase.co")
os.environ.setdefault("SUPABASE_KEY", "test-key")
os.environ.setdefault("API_KEY", "test-key")

from fastapi.testclient import TestClient
from main import app


def test_root_health_check_returns_status_and_message():
    client = TestClient(app)
    response = client.get("/")

    assert response.status_code == 200
    payload = response.json()
    assert payload["status"] == "success"
    assert payload["message"] == "Recipe Generator API is running."
    assert "server_time" in payload
    assert "server_timezone" in payload
