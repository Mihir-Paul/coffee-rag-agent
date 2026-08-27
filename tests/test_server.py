import pytest
from unittest.mock import AsyncMock, patch
from fastapi.testclient import TestClient
from server import app

client = TestClient(app)


def test_health_endpoint():
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert "rag" in data


def test_chat_endpoint_empty_message():
    response = client.post("/api/chat", json={"message": "   "})
    assert response.status_code == 400


@patch("server.runner.run_async")
def test_chat_endpoint_429_quota_exhausted(mock_run):
    mock_run.side_effect = Exception("429 RESOURCE_EXHAUSTED: Quota exceeded for quota metric...")
    response = client.post("/api/chat", json={"message": "What drinks do you have?"})
    assert response.status_code == 429
    data = response.json()
    assert data["error"] == "AI_QUOTA_EXHAUSTED"
    assert data["message"] == "AI service usage limit reached."


@patch("server.runner.run_async")
def test_chat_endpoint_503_temporarily_unavailable(mock_run):
    mock_run.side_effect = Exception("503 UNAVAILABLE: Model is overloaded")
    response = client.post("/api/chat", json={"message": "What drinks do you have?"})
    assert response.status_code == 503
    data = response.json()
    assert data["error"] == "AI_TEMPORARILY_UNAVAILABLE"
    assert data["message"] == "AI service is temporarily unavailable."


@patch("server.runner.run_async")
def test_chat_endpoint_403_authentication_error(mock_run):
    mock_run.side_effect = Exception("403 PERMISSION_DENIED: API key invalid")
    response = client.post("/api/chat", json={"message": "What drinks do you have?"})
    assert response.status_code == 403
    data = response.json()
    assert data["error"] == "AI_AUTHENTICATION_ERROR"
    assert data["message"] == "Authentication error with AI provider."


@patch("server.runner.run_async")
def test_chat_endpoint_404_model_not_found(mock_run):
    mock_run.side_effect = Exception("404 NOT_FOUND: Model not found")
    response = client.post("/api/chat", json={"message": "What drinks do you have?"})
    assert response.status_code == 404
    data = response.json()
    assert data["error"] == "AI_MODEL_NOT_FOUND"
    assert data["message"] == "Selected Gemini model is currently unavailable."
