import pytest
from unittest.mock import MagicMock, patch
from fastapi import FastAPI
from fastapi.testclient import TestClient


def test_logging_middleware_inserts_log():
    app = FastAPI()

    @app.get("/test")
    def endpoint():
        return {"ok": True}

    mock_table = MagicMock()
    mock_table.insert.return_value.execute.return_value = MagicMock()

    with patch("middleware.logging.get_db") as mock_db:
        mock_db.return_value.table.return_value = mock_table

        from middleware.logging import LoggingMiddleware
        app.add_middleware(LoggingMiddleware)

        client = TestClient(app)
        response = client.get("/test")

    assert response.status_code == 200
    mock_table.insert.assert_called_once()
    call_args = mock_table.insert.call_args[0][0]
    assert call_args["action"] == "request.get"
    assert call_args["level"] == "info"
    assert "path" in call_args["metadata"]


def test_log_event_helper_inserts_to_logs():
    mock_table = MagicMock()
    mock_table.insert.return_value.execute.return_value = MagicMock()

    with patch("middleware.logging.get_db") as mock_db:
        mock_db.return_value.table.return_value = mock_table

        from middleware.logging import log_event
        log_event("auth", "user.login", user_id="user-123", metadata={"email": "test@test.com"})

    mock_table.insert.assert_called_once()
    args = mock_table.insert.call_args[0][0]
    assert args["module"] == "auth"
    assert args["action"] == "user.login"
    assert args["user_id"] == "user-123"
    assert args["metadata"]["email"] == "test@test.com"


def test_logging_middleware_never_breaks_request():
    """Even if DB insert fails, request must still succeed."""
    app = FastAPI()

    @app.get("/test")
    def endpoint():
        return {"ok": True}

    with patch("middleware.logging.get_db") as mock_db:
        mock_db.side_effect = Exception("DB is down")

        from middleware.logging import LoggingMiddleware
        app.add_middleware(LoggingMiddleware)

        client = TestClient(app)
        response = client.get("/test")

    assert response.status_code == 200
