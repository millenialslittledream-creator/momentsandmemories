import pytest
from unittest.mock import MagicMock


def test_get_dashboard_summary(mock_db):
    count_mock = MagicMock()
    count_mock.count = 5

    revenue_mock = MagicMock()
    revenue_mock.data = [{"sum": 299.99}]

    def table_side_effect(table_name):
        mock = MagicMock()
        mock.select.return_value.execute.return_value = count_mock
        mock.select.return_value.eq.return_value.execute.return_value = count_mock
        return mock

    mock_db.table.side_effect = table_side_effect
    mock_db.rpc.return_value.execute.return_value = revenue_mock

    from analytics.service import get_dashboard
    result = get_dashboard()
    assert "total_users" in result
    assert "total_events" in result
    assert "total_orders" in result
    assert "total_revenue" in result
    assert "pending_orders" in result
    assert "notifications_sent" in result
    assert "notifications_failed" in result
    assert result["total_revenue"] == 299.99
    assert result["total_users"] == 5
    assert result["pending_orders"] == 5
    assert result["notifications_sent"] == 5
    assert result["notifications_failed"] == 5


def test_get_recent_logs(mock_db):
    mock_db.table.return_value.select.return_value.order.return_value.limit.return_value.execute.return_value = MagicMock(
        data=[{"id": "log-1", "action": "user.login", "level": "info"}]
    )

    from analytics.service import get_recent_logs
    result = get_recent_logs(limit=10)
    assert len(result) == 1
    assert result[0]["action"] == "user.login"


def test_get_user_growth(mock_db):
    mock_db.rpc.return_value.execute.return_value = MagicMock(
        data=[{"day": "2026-04-01", "count": 3}]
    )

    from analytics.service import get_user_growth
    result = get_user_growth(days=7)
    assert len(result) == 1
    assert result[0]["count"] == 3


def test_get_order_stats(mock_db):
    mock_db.rpc.return_value.execute.return_value = MagicMock(
        data=[{"day": "2026-04-01", "order_count": 2, "revenue": 59.98}]
    )

    from analytics.service import get_order_stats
    result = get_order_stats(days=7)
    assert len(result) == 1
    assert result[0]["revenue"] == 59.98
