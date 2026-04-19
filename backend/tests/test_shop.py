import pytest
from unittest.mock import MagicMock


def test_list_active_items(mock_db):
    mock_db.table.return_value.select.return_value.eq.return_value.execute.return_value = MagicMock(
        data=[{"id": "item-1", "name": "Gift Box", "price": 29.99, "is_active": True}]
    )

    from shop.service import list_items
    result = list_items()
    assert len(result) == 1
    assert result[0]["name"] == "Gift Box"


def test_create_order(mock_db):
    # Mock shop_items lookup
    mock_db.table.return_value.select.return_value.eq.return_value.in_.return_value.execute.return_value = MagicMock(
        data=[{"id": "item-1", "price": 29.99, "stock": 10, "is_active": True}]
    )
    mock_db.table.return_value.insert.return_value.execute.return_value = MagicMock(
        data=[{"id": "order-123", "status": "pending", "total_amount": 29.99}]
    )

    from shop.service import create_order
    from shop.schemas import CreateOrderRequest, OrderItemIn

    result = create_order("user-123", CreateOrderRequest(
        items=[OrderItemIn(shop_item_id="item-1", quantity=1)],
        shipping_address={"street": "123 Main St", "city": "NYC"},
    ))
    assert result["id"] == "order-123"


def test_create_order_out_of_stock(mock_db):
    mock_db.table.return_value.select.return_value.eq.return_value.in_.return_value.execute.return_value = MagicMock(
        data=[{"id": "item-1", "price": 29.99, "stock": 0, "is_active": True}]
    )

    from shop.service import create_order
    from shop.schemas import CreateOrderRequest, OrderItemIn

    with pytest.raises(ValueError, match="out of stock"):
        create_order("user-123", CreateOrderRequest(
            items=[OrderItemIn(shop_item_id="item-1", quantity=1)],
        ))
