"""
Unit Tests for Supabase Authentication, Customer ID Mapping, and User Isolation.
"""

import pytest
from fastapi.testclient import TestClient
from server import app

client = TestClient(app)


def test_unauthenticated_chat_rejected():
    """Verify that requests without Bearer authorization token are rejected with 401."""
    response = client.post("/api/chat", json={"message": "Recommend something cold"})
    assert response.status_code == 401
    assert "Authentication required" in response.json()["detail"]


def test_unauthenticated_me_rejected():
    """Verify that /api/me without Bearer token returns 401."""
    response = client.get("/api/me")
    assert response.status_code == 401


def test_user_a_aarav_profile_and_id_privacy():
    """Verify User A (Aarav) profile mapping and confirm internal ID (C001) is never exposed."""
    headers = {"Authorization": "Bearer test-aarav-token"}
    response = client.get("/api/me", headers=headers)
    assert response.status_code == 200
    
    data = response.json()
    assert data["name"] == "Aarav"
    assert data["email"] == "aarav@coffeemind.ai"
    # Ensure internal customer_id (C001) is NOT exposed in the customer-facing user profile JSON
    assert "C001" not in str(data)
    assert "customer_id" not in data


def test_user_b_priya_profile_and_id_privacy():
    """Verify User B (Priya) profile mapping and confirm internal ID (C002) is never exposed."""
    headers = {"Authorization": "Bearer test-priya-token"}
    response = client.get("/api/me", headers=headers)
    assert response.status_code == 200
    
    data = response.json()
    assert data["name"] == "Priya"
    assert data["email"] == "priya@coffeemind.ai"
    assert "C002" not in str(data)
    assert "customer_id" not in data


def test_authenticated_chat_endpoint(monkeypatch):
    """Verify authenticated chat call succeeds and derives customer context on server-side."""
    # Mock runner execution to prevent consuming live Gemini quota during testing
    async def mock_run_async(*args, **kwargs):
        class MockPart:
            text = "Here is an Oat Milk Iced Latte tailored for you!"
        class MockContent:
            parts = [MockPart()]
        class MockEvent:
            content = MockContent()
        yield MockEvent()

    from server import runner
    monkeypatch.setattr(runner, "run_async", mock_run_async)

    headers = {"Authorization": "Bearer test-aarav-token"}
    payload = {"message": "I want something cold"}
    
    response = client.post("/api/chat", json=payload, headers=headers)
    assert response.status_code == 200
    
    res_data = response.json()
    assert res_data["status"] == "success"
    assert "Oat Milk Iced Latte" in res_data["response"]
    assert res_data["session_id"] is not None


def test_user_isolation_security():
    """Verify strict user isolation (User B cannot access User A's private conversations)."""
    # User A (Aarav) headers
    headers_aarav = {"Authorization": "Bearer test-aarav-token"}
    
    # User B (Priya) headers
    headers_priya = {"Authorization": "Bearer test-priya-token"}

    # User A creates a conversation
    res_conv = client.post("/api/conversations", headers=headers_aarav)
    assert res_conv.status_code == 200
    conv_id = res_conv.json()["id"]

    # User B attempts to access User A's conversation directly
    res_unauthorized_access = client.get(f"/api/conversations/{conv_id}/messages", headers=headers_priya)
    assert res_unauthorized_access.status_code == 403
    assert "Access denied" in res_unauthorized_access.json()["detail"]
