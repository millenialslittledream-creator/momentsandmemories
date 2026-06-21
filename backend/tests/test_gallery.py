import pytest
from unittest.mock import MagicMock


def _table_router(mock_db, responses):
    def table_side_effect(name):
        return responses[name]
    mock_db.table.side_effect = table_side_effect


def test_upload_guest_photo_success(mock_db):
    events_chain = MagicMock()
    events_chain.select.return_value.eq.return_value.eq.return_value.execute.return_value = MagicMock(
        data=[{"id": "event-1"}]
    )
    photos_chain = MagicMock()
    photos_chain.insert.return_value.execute.return_value = MagicMock(
        data=[{"id": "photo-1", "event_id": "event-1", "public_url": "https://x/p1.jpg", "approved": True}]
    )
    _table_router(mock_db, {"events": events_chain, "event_gallery_photos": photos_chain})
    mock_db.storage.from_.return_value.get_public_url.return_value = "https://x/p1.jpg"

    from gallery.service import upload_guest_photo

    result = upload_guest_photo("event-1", "Jamie", "p1.jpg", b"x" * 100, "image/jpeg")
    assert result["id"] == "photo-1"
    mock_db.storage.from_.return_value.upload.assert_called_once()


def test_upload_guest_photo_event_not_published(mock_db):
    events_chain = MagicMock()
    events_chain.select.return_value.eq.return_value.eq.return_value.execute.return_value = MagicMock(data=[])
    _table_router(mock_db, {"events": events_chain})

    from gallery.service import upload_guest_photo

    with pytest.raises(ValueError, match="not accepting photos"):
        upload_guest_photo("event-1", "Jamie", "p1.jpg", b"x", "image/jpeg")


def test_upload_guest_photo_rejects_non_image(mock_db):
    events_chain = MagicMock()
    events_chain.select.return_value.eq.return_value.eq.return_value.execute.return_value = MagicMock(
        data=[{"id": "event-1"}]
    )
    _table_router(mock_db, {"events": events_chain})

    from gallery.service import upload_guest_photo

    with pytest.raises(ValueError, match="Only image files"):
        upload_guest_photo("event-1", "Jamie", "clip.mp4", b"x", "video/mp4")


def test_upload_guest_photo_rejects_oversized(mock_db):
    events_chain = MagicMock()
    events_chain.select.return_value.eq.return_value.eq.return_value.execute.return_value = MagicMock(
        data=[{"id": "event-1"}]
    )
    _table_router(mock_db, {"events": events_chain})

    from gallery.service import upload_guest_photo, MAX_IMAGE_BYTES

    with pytest.raises(ValueError, match="too large"):
        upload_guest_photo("event-1", "Jamie", "huge.jpg", b"x" * (MAX_IMAGE_BYTES + 1), "image/jpeg")


def test_list_approved_photos(mock_db):
    events_chain = MagicMock()
    events_chain.select.return_value.eq.return_value.eq.return_value.execute.return_value = MagicMock(
        data=[{"id": "event-1"}]
    )
    photos_chain = MagicMock()
    photos_chain.select.return_value.eq.return_value.eq.return_value.order.return_value.execute.return_value = MagicMock(
        data=[{"id": "photo-1"}, {"id": "photo-2"}]
    )
    _table_router(mock_db, {"events": events_chain, "event_gallery_photos": photos_chain})

    from gallery.service import list_approved_photos

    result = list_approved_photos("event-1")
    assert len(result) == 2


def test_set_photo_approval_not_owned(mock_db):
    photos_chain = MagicMock()
    photos_chain.select.return_value.eq.return_value.execute.return_value = MagicMock(
        data=[{"id": "photo-1", "event_id": "event-1"}]
    )
    events_chain = MagicMock()
    events_chain.select.return_value.eq.return_value.eq.return_value.execute.return_value = MagicMock(data=[])
    _table_router(mock_db, {"event_gallery_photos": photos_chain, "events": events_chain})

    from gallery.service import set_photo_approval

    with pytest.raises(ValueError, match="not found"):
        set_photo_approval("not-the-owner", "photo-1", False)


def test_delete_photo_success(mock_db):
    photos_chain = MagicMock()
    photos_chain.select.return_value.eq.return_value.execute.return_value = MagicMock(
        data=[{"id": "photo-1", "event_id": "event-1", "storage_path": "gallery/event-1/x.jpg"}]
    )
    events_chain = MagicMock()
    events_chain.select.return_value.eq.return_value.eq.return_value.execute.return_value = MagicMock(
        data=[{"id": "event-1"}]
    )
    _table_router(mock_db, {"event_gallery_photos": photos_chain, "events": events_chain})

    from gallery.service import delete_photo

    delete_photo("owner-1", "photo-1")
    mock_db.storage.from_.return_value.remove.assert_called_once_with(["gallery/event-1/x.jpg"])
