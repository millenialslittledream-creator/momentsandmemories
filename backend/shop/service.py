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


def _adjust_stock(db, item_id: str, delta: int) -> None:
    """Compare-and-swap stock change (delta < 0 reserves, delta > 0 releases).

    The UPDATE only matches if stock is still the value we read, so two concurrent orders can
    never both succeed against the same units. Retries a few times on contention.
    """
    for _ in range(5):
        rows = db.table("shop_items").select("stock,name").eq("id", item_id).execute().data
        if not rows:
            raise ValueError("Item not found")
        current = rows[0]["stock"]
        if current + delta < 0:
            raise ValueError(f"Item {rows[0].get('name', item_id)} is out of stock")
        updated = (
            db.table("shop_items").update({"stock": current + delta}).eq("id", item_id).eq("stock", current).execute()
        )
        if updated.data:
            return
    raise ValueError("Stock is changing rapidly; please try again")


def create_order(user_id: str, data: CreateOrderRequest) -> dict:
    db = database.get_db()

    # Merge duplicate lines so the stock check and the reservation see the true quantity.
    quantities: dict[str, int] = {}
    for line in data.items:
        quantities[line.shop_item_id] = quantities.get(line.shop_item_id, 0) + line.quantity

    items_result = db.table("shop_items").select("*").eq("is_active", True).in_("id", list(quantities)).execute()
    items_map = {item["id"]: item for item in items_result.data}

    for item_id, quantity in quantities.items():
        item = items_map.get(item_id)
        if not item:
            raise ValueError(f"Item {item_id} not found")
        if item["stock"] < quantity:
            raise ValueError(f"Item {item.get('name', item_id)} is out of stock")

    subtotal = round(sum(items_map[item_id]["price"] * qty for item_id, qty in quantities.items()), 2)
    tax = round(subtotal * 0.08, 2)
    total = round(subtotal + tax, 2)

    # Reserve stock first; if anything later fails, give every reserved unit back.
    reserved: list[tuple[str, int]] = []
    order_id = None
    try:
        for item_id, quantity in quantities.items():
            _adjust_stock(db, item_id, -quantity)
            reserved.append((item_id, quantity))

        order_result = db.table("orders").insert({
            "user_id": user_id,
            "status": "pending",
            "subtotal": subtotal,
            "tax": tax,
            "total_amount": total,
            "shipping_address": data.shipping_address,
        }).execute()
        order = order_result.data[0]
        order_id = order["id"]
        db.table("order_items").insert([
            {
                "order_id": order_id,
                "shop_item_id": item_id,
                "quantity": quantity,
                "unit_price": items_map[item_id]["price"],
            }
            for item_id, quantity in quantities.items()
        ]).execute()
    except Exception:
        for item_id, quantity in reserved:
            try:
                _adjust_stock(db, item_id, quantity)
            except Exception:
                pass
        if order_id:
            try:
                db.table("orders").delete().eq("id", order_id).execute()
            except Exception:
                pass
        raise

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
