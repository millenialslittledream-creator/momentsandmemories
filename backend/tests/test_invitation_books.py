import pytest
from unittest.mock import MagicMock


def _table_router(mock_db, responses):
    def table_side_effect(name):
        return responses[name]
    mock_db.table.side_effect = table_side_effect


def test_create_invitation_book(mock_db):
    events_chain = MagicMock()
    events_chain.select.return_value.eq.return_value.eq.return_value.execute.return_value = MagicMock(
        data=[{"id": "event-1"}]
    )
    books_chain = MagicMock()
    books_chain.select.return_value.eq.return_value.execute.return_value = MagicMock(data=[])
    books_chain.insert.return_value.execute.return_value = MagicMock(
        data=[{"id": "book-1", "event_id": "event-1", "pages": []}]
    )
    _table_router(mock_db, {"events": events_chain, "invitation_books": books_chain})

    from invitation_books.service import create_invitation_book
    from invitation_books.schemas import CreateInvitationBookRequest

    result = create_invitation_book("user-1", CreateInvitationBookRequest(event_id="event-1"))
    assert result["id"] == "book-1"


def test_create_invitation_book_already_exists_for_event(mock_db):
    events_chain = MagicMock()
    events_chain.select.return_value.eq.return_value.eq.return_value.execute.return_value = MagicMock(
        data=[{"id": "event-1"}]
    )
    books_chain = MagicMock()
    books_chain.select.return_value.eq.return_value.execute.return_value = MagicMock(
        data=[{"id": "existing-book"}]
    )
    _table_router(mock_db, {"events": events_chain, "invitation_books": books_chain})

    from invitation_books.service import create_invitation_book
    from invitation_books.schemas import CreateInvitationBookRequest

    with pytest.raises(ValueError, match="already has an invitation book"):
        create_invitation_book("user-1", CreateInvitationBookRequest(event_id="event-1"))


def test_create_invitation_book_event_not_owned(mock_db):
    events_chain = MagicMock()
    events_chain.select.return_value.eq.return_value.eq.return_value.execute.return_value = MagicMock(data=[])
    _table_router(mock_db, {"events": events_chain})

    from invitation_books.service import create_invitation_book
    from invitation_books.schemas import CreateInvitationBookRequest

    with pytest.raises(ValueError, match="Event not found"):
        create_invitation_book("user-1", CreateInvitationBookRequest(event_id="not-mine"))


def test_get_invitation_book_not_found(mock_db):
    mock_db.table.return_value.select.return_value.eq.return_value.eq.return_value.execute.return_value = MagicMock(
        data=[]
    )

    from invitation_books.service import get_invitation_book

    with pytest.raises(ValueError, match="not found"):
        get_invitation_book("user-1", "missing")


def test_update_invitation_book_pages(mock_db):
    select_chain = mock_db.table.return_value.select.return_value.eq.return_value.eq.return_value
    select_chain.execute.return_value = MagicMock(data=[{"id": "book-1", "user_id": "user-1"}])

    update_chain = mock_db.table.return_value.update.return_value.eq.return_value.eq.return_value
    update_chain.execute.return_value = MagicMock(
        data=[{"id": "book-1", "pages": [{"id": "p1", "image_url": "https://x/1.png"}]}]
    )

    from invitation_books.service import update_invitation_book
    from invitation_books.schemas import UpdateInvitationBookRequest

    result = update_invitation_book(
        "user-1", "book-1", UpdateInvitationBookRequest(pages=[{"id": "p1", "image_url": "https://x/1.png"}])
    )
    assert len(result["pages"]) == 1


def test_delete_invitation_book_not_owned(mock_db):
    mock_db.table.return_value.select.return_value.eq.return_value.eq.return_value.execute.return_value = MagicMock(
        data=[]
    )

    from invitation_books.service import delete_invitation_book

    with pytest.raises(ValueError, match="not found"):
        delete_invitation_book("user-1", "not-mine")


def test_get_public_book_for_event_not_published(mock_db):
    mock_db.table.return_value.select.return_value.eq.return_value.eq.return_value.execute.return_value = MagicMock(
        data=[]
    )

    from invitation_books.service import get_public_book_for_event

    with pytest.raises(ValueError, match="not found"):
        get_public_book_for_event("event-1")


def test_get_public_book_for_event_published(mock_db):
    mock_db.table.return_value.select.return_value.eq.return_value.eq.return_value.execute.return_value = MagicMock(
        data=[{"id": "book-1", "event_id": "event-1", "published": True, "pages": [{"id": "p1"}]}]
    )

    from invitation_books.service import get_public_book_for_event

    result = get_public_book_for_event("event-1")
    assert result["id"] == "book-1"
