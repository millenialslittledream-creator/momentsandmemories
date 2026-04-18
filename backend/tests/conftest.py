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
