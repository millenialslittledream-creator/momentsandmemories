import pytest
from unittest.mock import MagicMock


def test_get_dashboard_summary(mock_db):
    # _count uses .select("id", count="exact").execute() — result.count is the count
    # revenue uses .rpc("sum_revenue").execute() — result.data[0]["sum"]

    count_mock = MagicMock()
    count_mock.count = 5  # default count for all tables

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
    assert result["total_revenue"] == 299.99
