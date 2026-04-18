from unittest.mock import patch, MagicMock


def test_get_db_returns_client():
    with patch("database.create_client") as mock_create:
        mock_client = MagicMock()
        mock_create.return_value = mock_client

        import database
        database._client = None  # reset singleton

        from database import get_db
        result = get_db()
        assert result is not None
        mock_create.assert_called_once()


def test_get_db_singleton():
    """Second call returns same instance without re-creating."""
    with patch("database.create_client") as mock_create:
        mock_client = MagicMock()
        mock_create.return_value = mock_client

        import database
        database._client = None

        from database import get_db
        r1 = get_db()
        r2 = get_db()
        assert r1 is r2
        assert mock_create.call_count == 1  # only created once
