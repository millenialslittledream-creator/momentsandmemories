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


def _stock_item(fake_db, stock=10, price=29.99):
    fake_db.STORE["shop_items"] = [{"id": "item-1", "name": "Gift Box", "price": price, "stock": stock, "is_active": True}]


def test_create_order(fake_db):
    _stock_item(fake_db)
    from shop.service import create_order
    from shop.schemas import CreateOrderRequest, OrderItemIn

    result = create_order("user-123", CreateOrderRequest(
        items=[OrderItemIn(shop_item_id="item-1", quantity=1)],
        shipping_address={"street": "123 Main St", "city": "NYC"},
    ))
    assert result["status"] == "pending"
    assert result["total_amount"] == 32.39
    assert fake_db.STORE["shop_items"][0]["stock"] == 9
    assert len(fake_db.STORE["order_items"]) == 1


def test_order_rejects_zero_and_negative_quantities():
    from shop.schemas import OrderItemIn
    from pydantic import ValidationError
    for bad in (0, -1, -10, 101):
        with pytest.raises(ValidationError):
            OrderItemIn(shop_item_id="item-1", quantity=bad)


def test_duplicate_lines_are_merged_and_cannot_oversell(fake_db):
    _stock_item(fake_db, stock=5)
    from shop.service import create_order
    from shop.schemas import CreateOrderRequest, OrderItemIn

    with pytest.raises(ValueError, match="out of stock"):
        create_order("u", CreateOrderRequest(items=[
            OrderItemIn(shop_item_id="item-1", quantity=3), OrderItemIn(shop_item_id="item-1", quantity=3)]))
    assert fake_db.STORE["shop_items"][0]["stock"] == 5      # nothing reserved
    assert fake_db.STORE.get("orders", []) == []             # no orphan order


def test_failed_order_releases_reserved_stock(fake_db):
    _stock_item(fake_db, stock=5)
    from shop import service
    from shop.schemas import CreateOrderRequest, OrderItemIn
    from unittest.mock import patch

    real_get_db = service.database.get_db()
    original_table = real_get_db.table

    def table(name):
        if name == "order_items":
            raise RuntimeError("db down")
        return original_table(name)

    with patch.object(real_get_db, "table", side_effect=table):
        with pytest.raises(RuntimeError):
            service.create_order("u", CreateOrderRequest(items=[OrderItemIn(shop_item_id="item-1", quantity=2)]))
    assert fake_db.STORE["shop_items"][0]["stock"] == 5      # stock given back
    assert fake_db.STORE.get("orders", []) == []             # order row removed


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
