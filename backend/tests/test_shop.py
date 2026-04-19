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
    items_mock = MagicMock()
    orders_mock = MagicMock()
    order_items_mock = MagicMock()
    shop_items_update_mock = MagicMock()

    items_mock.select.return_value.eq.return_value.in_.return_value.execute.return_value = MagicMock(
        data=[{"id": "item-1", "name": "Gift Box", "price": 29.99, "stock": 10, "is_active": True}]
    )
    orders_mock.insert.return_value.execute.return_value = MagicMock(
        data=[{"id": "order-123", "status": "pending", "total_amount": 32.39}]
    )
    order_items_mock.insert.return_value.execute.return_value = MagicMock(data=[{}])
    shop_items_update_mock.update.return_value.eq.return_value.execute.return_value = MagicMock(data=[{}])

    call_count = {"shop_items": 0}

    def table_router(name):
        if name == "shop_items":
            call_count["shop_items"] += 1
            if call_count["shop_items"] == 1:
                return items_mock
            return shop_items_update_mock
        if name == "orders":
            return orders_mock
        if name == "order_items":
            return order_items_mock
        return MagicMock()

    mock_db.table.side_effect = table_router

    from shop.service import create_order
    from shop.schemas import CreateOrderRequest, OrderItemIn

    result = create_order("user-123", CreateOrderRequest(
        items=[OrderItemIn(shop_item_id="item-1", quantity=1)],
        shipping_address={"street": "123 Main St", "city": "NYC"},
    ))
    assert result["id"] == "order-123"
    orders_mock.insert.assert_called_once()
    order_items_mock.insert.assert_called_once()


def test_create_order_out_of_stock(mock_db):
    items_mock = MagicMock()
    items_mock.select.return_value.eq.return_value.in_.return_value.execute.return_value = MagicMock(
        data=[{"id": "item-1", "name": "Gift Box", "price": 29.99, "stock": 0, "is_active": True}]
    )
    mock_db.table.return_value = items_mock

    from shop.service import create_order
    from shop.schemas import CreateOrderRequest, OrderItemIn

    with pytest.raises(ValueError, match="out of stock"):
        create_order("user-123", CreateOrderRequest(
            items=[OrderItemIn(shop_item_id="item-1", quantity=1)],
        ))
