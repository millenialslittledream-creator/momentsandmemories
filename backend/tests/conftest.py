import pytest
from unittest.mock import MagicMock, patch
import database


@pytest.fixture(autouse=True)
def reset_db_singleton():
    database._client = None
    yield
    database._client = None


@pytest.fixture
def mock_db():
    with patch("database.get_db") as mock:
        client = MagicMock()
        mock.return_value = client
        yield client


@pytest.fixture(autouse=True)
def reset_rate_limits():
    from middleware import ratelimit
    from middleware.auth import reset_admin_lockouts
    ratelimit.reset_all()
    reset_admin_lockouts()
    yield


@pytest.fixture
def fake_db():
    """Real backend code against an in-memory database (see tests/fakedb.py)."""
    from tests import fakedb
    fakedb.reset()
    db = fakedb.FakeDB()
    with patch("database.get_db", return_value=db):
        yield fakedb


@pytest.fixture
def client(fake_db):
    from fastapi.testclient import TestClient
    import main
    return TestClient(main.app)
