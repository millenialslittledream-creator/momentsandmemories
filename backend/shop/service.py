from datetime import datetime, timezone
import database
from middleware.logging import log_event as _log
from shop.schemas import CreateOrderRequest


def list_items(category: str | None = None) -> list:
    db = database.get_db()
    query = db.table("shop_items").select("*").eq("is_active", True)
    if category:
        query = query.eq("category", category)
    return query.execute().data


def get_item(item_id: str) -> dict:
    db = database.get_db()
    result = db.table("shop_items").select("*").eq("id", item_id).eq("is_active", True).execute()
    if not result.data:
        raise ValueError("Item not found")
    return result.data[0]


def create_order(user_id: str, data: CreateOrderRequest) -> dict:
    db = database.get_db()
    item_ids = [i.shop_item_id for i in data.items]
    items_result = db.table("shop_items").select("*").eq("is_active", True).in_("id", item_ids).execute()
    items_map = {item["id"]: item for item in items_result.data}

    for req_item in data.items:
        item = items_map.get(req_item.shop_item_id)
        if not item:
            raise ValueError(f"Item {req_item.shop_item_id} not found")
        if item["stock"] < req_item.quantity:
            raise ValueError(f"Item {item.get('name', req_item.shop_item_id)} is out of stock")

    subtotal = sum(items_map[i.shop_item_id]["price"] * i.quantity for i in data.items)
    tax = round(subtotal * 0.08, 2)
    total = round(subtotal + tax, 2)

    order_result = db.table("orders").insert({
        "user_id": user_id,
        "status": "pending",
        "subtotal": subtotal,
        "tax": tax,
        "total_amount": total,
        "shipping_address": data.shipping_address,
    }).execute()

    order = order_result.data[0]
    order_items_rows = [
        {
            "order_id": order["id"],
            "shop_item_id": i.shop_item_id,
            "quantity": i.quantity,
            "unit_price": items_map[i.shop_item_id]["price"],
        }
        for i in data.items
    ]
    db.table("order_items").insert(order_items_rows).execute()

    for req_item in data.items:
        new_stock = items_map[req_item.shop_item_id]["stock"] - req_item.quantity
        updated = (
            db.table("shop_items")
            .update({"stock": new_stock})
            .eq("id", req_item.shop_item_id)
            .gte("stock", req_item.quantity)  # atomic guard: reject if already decremented by concurrent request
            .execute()
        )
        if not updated.data:
            raise ValueError(f"Item {items_map[req_item.shop_item_id].get('name', req_item.shop_item_id)} is no longer in stock")

    _log("shop", "order.created", user_id=user_id, metadata={"order_id": order["id"], "total": total})
    return order


def list_orders(user_id: str) -> list:
    db = database.get_db()
    return db.table("orders").select("*").eq("user_id", user_id).order("created_at", desc=True).execute().data


def get_order(user_id: str, order_id: str) -> dict:
    db = database.get_db()
    result = db.table("orders").select("*, order_items(*)").eq("id", order_id).eq("user_id", user_id).execute()
    if not result.data:
        raise ValueError("Order not found")
    return result.data[0]


def update_order_status(order_id: str, status: str) -> dict:
    db = database.get_db()
    result = db.table("orders").update({
        "status": status,
        "updated_at": datetime.now(timezone.utc).isoformat(),
    }).eq("id", order_id).execute()
    _log("shop", "order.status_changed", metadata={"order_id": order_id, "status": status})
    if not result.data:
        raise ValueError("Order not found")
    return result.data[0]
