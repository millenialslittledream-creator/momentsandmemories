import pytest
from unittest.mock import MagicMock


def _table_router(mock_db, responses):
    """responses: dict of table name -> MagicMock chain result for .execute()"""
    def table_side_effect(name):
        return responses[name]
    mock_db.table.side_effect = table_side_effect


def test_create_event_website(mock_db):
    events_chain = MagicMock()
    events_chain.select.return_value.eq.return_value.eq.return_value.execute.return_value = MagicMock(
        data=[{"id": "event-1"}]
    )
    websites_chain = MagicMock()
    websites_chain.select.return_value.eq.return_value.execute.return_value = MagicMock(data=[])
    websites_chain.insert.return_value.execute.return_value = MagicMock(
        data=[{"id": "site-1", "slug": "alex-and-sam", "event_id": "event-1"}]
    )
    _table_router(mock_db, {"events": events_chain, "event_websites": websites_chain})

    from event_websites.service import create_event_website
    from event_websites.schemas import CreateEventWebsiteRequest

    result = create_event_website(
        "user-1", CreateEventWebsiteRequest(event_id="event-1", slug="alex-and-sam")
    )
    assert result["id"] == "site-1"


def test_create_event_website_already_exists_for_event(mock_db):
    events_chain = MagicMock()
    events_chain.select.return_value.eq.return_value.eq.return_value.execute.return_value = MagicMock(
        data=[{"id": "event-1"}]
    )
    websites_chain = MagicMock()
    websites_chain.select.return_value.eq.return_value.execute.return_value = MagicMock(
        data=[{"id": "existing-site"}]
    )
    _table_router(mock_db, {"events": events_chain, "event_websites": websites_chain})

    from event_websites.service import create_event_website
    from event_websites.schemas import CreateEventWebsiteRequest

    with pytest.raises(ValueError, match="already has a website"):
        create_event_website("user-1", CreateEventWebsiteRequest(event_id="event-1", slug="another-one"))


def test_create_event_website_event_not_owned(mock_db):
    events_chain = MagicMock()
    events_chain.select.return_value.eq.return_value.eq.return_value.execute.return_value = MagicMock(data=[])
    _table_router(mock_db, {"events": events_chain})

    from event_websites.service import create_event_website
    from event_websites.schemas import CreateEventWebsiteRequest

    with pytest.raises(ValueError, match="Event not found"):
        create_event_website("user-1", CreateEventWebsiteRequest(event_id="not-mine", slug="x"))


def test_create_event_website_duplicate_slug(mock_db):
    events_chain = MagicMock()
    events_chain.select.return_value.eq.return_value.eq.return_value.execute.return_value = MagicMock(
        data=[{"id": "event-1"}]
    )
    websites_chain = MagicMock()
    websites_chain.select.return_value.eq.return_value.execute.return_value = MagicMock(data=[])
    websites_chain.insert.return_value.execute.side_effect = Exception("duplicate key value violates unique constraint")
    _table_router(mock_db, {"events": events_chain, "event_websites": websites_chain})

    from event_websites.service import create_event_website
    from event_websites.schemas import CreateEventWebsiteRequest

    with pytest.raises(ValueError, match="already taken"):
        create_event_website("user-1", CreateEventWebsiteRequest(event_id="event-1", slug="taken"))


def test_get_event_website_not_found(mock_db):
    mock_db.table.return_value.select.return_value.eq.return_value.eq.return_value.execute.return_value = MagicMock(
        data=[]
    )

    from event_websites.service import get_event_website

    with pytest.raises(ValueError, match="not found"):
        get_event_website("user-1", "missing")


def test_update_event_website(mock_db):
    select_chain = mock_db.table.return_value.select.return_value.eq.return_value.eq.return_value
    select_chain.execute.return_value = MagicMock(data=[{"id": "site-1", "user_id": "user-1"}])

    update_chain = mock_db.table.return_value.update.return_value.eq.return_value.eq.return_value
    update_chain.execute.return_value = MagicMock(data=[{"id": "site-1", "published": True}])

    from event_websites.service import update_event_website
    from event_websites.schemas import UpdateEventWebsiteRequest

    result = update_event_website("user-1", "site-1", UpdateEventWebsiteRequest(published=True))
    assert result["published"] is True


def test_delete_event_website_not_owned(mock_db):
    mock_db.table.return_value.select.return_value.eq.return_value.eq.return_value.execute.return_value = MagicMock(
        data=[]
    )

    from event_websites.service import delete_event_website

    with pytest.raises(ValueError, match="not found"):
        delete_event_website("user-1", "not-mine")


def test_get_public_website_by_slug_not_published(mock_db):
    mock_db.table.return_value.select.return_value.eq.return_value.eq.return_value.execute.return_value = MagicMock(
        data=[]
    )

    from event_websites.service import get_public_website_by_slug

    with pytest.raises(ValueError, match="not found"):
        get_public_website_by_slug("unpublished-slug")


def test_get_public_website_by_slug_published(mock_db):
    websites_chain = MagicMock()
    websites_chain.select.return_value.eq.return_value.eq.return_value.execute.return_value = MagicMock(
        data=[{"id": "site-1", "slug": "alex-and-sam", "event_id": "event-1", "published": True}]
    )
    events_chain = MagicMock()
    events_chain.select.return_value.eq.return_value.execute.return_value = MagicMock(
        data=[{"id": "event-1", "title": "Alex & Sam's Wedding"}]
    )
    _table_router(mock_db, {"event_websites": websites_chain, "events": events_chain})

    from event_websites.service import get_public_website_by_slug

    result = get_public_website_by_slug("alex-and-sam")
    assert result["slug"] == "alex-and-sam"
    assert result["event"]["title"] == "Alex & Sam's Wedding"
