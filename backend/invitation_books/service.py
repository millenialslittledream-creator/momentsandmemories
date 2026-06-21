from datetime import datetime, timezone
import database
from middleware.logging import log_event as _log
from invitation_books.schemas import CreateInvitationBookRequest, UpdateInvitationBookRequest


def _assert_owns_event(db, user_id: str, event_id: str) -> None:
    result = db.table("events").select("id").eq("id", event_id).eq("user_id", user_id).execute()
    if not result.data:
        raise ValueError("Event not found")


def _get_owned(db, user_id: str, book_id: str) -> dict:
    result = db.table("invitation_books").select("*").eq("id", book_id).eq("user_id", user_id).execute()
    if not result.data:
        raise ValueError("Book not found")
    return result.data[0]


def create_invitation_book(user_id: str, data: CreateInvitationBookRequest) -> dict:
    db = database.get_db()
    _assert_owns_event(db, user_id, data.event_id)

    existing = db.table("invitation_books").select("id").eq("event_id", data.event_id).execute()
    if existing.data:
        raise ValueError("This event already has an invitation book — edit the existing one instead of creating another")

    result = db.table("invitation_books").insert({
        "event_id": data.event_id,
        "user_id": user_id,
        "title": data.title,
        "pages": data.pages,
        "published": data.published,
    }).execute()

    book = result.data[0]
    _log("invitation_books", "book.created", user_id=user_id, metadata={"id": book["id"]})
    return book


def get_invitation_book(user_id: str, book_id: str) -> dict:
    db = database.get_db()
    return _get_owned(db, user_id, book_id)


def update_invitation_book(user_id: str, book_id: str, data: UpdateInvitationBookRequest) -> dict:
    db = database.get_db()
    _get_owned(db, user_id, book_id)

    updates = data.model_dump(exclude_none=True)
    updates["updated_at"] = datetime.now(timezone.utc).isoformat()
    result = db.table("invitation_books").update(updates).eq("id", book_id).eq("user_id", user_id).execute()

    _log("invitation_books", "book.updated", user_id=user_id, metadata={"id": book_id})
    return result.data[0]


def delete_invitation_book(user_id: str, book_id: str) -> None:
    db = database.get_db()
    _get_owned(db, user_id, book_id)
    db.table("invitation_books").delete().eq("id", book_id).eq("user_id", user_id).execute()
    _log("invitation_books", "book.deleted", user_id=user_id, metadata={"id": book_id})


def list_invitation_books(user_id: str) -> list:
    db = database.get_db()
    return (
        db.table("invitation_books")
        .select("*")
        .eq("user_id", user_id)
        .order("updated_at", desc=True)
        .execute().data
    )


def get_public_book_for_event(event_id: str) -> dict:
    db = database.get_db()
    result = (
        db.table("invitation_books")
        .select("*")
        .eq("event_id", event_id)
        .eq("published", True)
        .execute()
    )
    if not result.data:
        raise ValueError("Book not found")
    return result.data[0]
