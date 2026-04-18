import pytest
from unittest.mock import MagicMock, patch


@pytest.fixture
def mock_db():
    with patch("database.get_db") as mock:
        client = MagicMock()
        mock.return_value = client
        yield client
