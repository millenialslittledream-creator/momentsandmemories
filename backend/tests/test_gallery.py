import pytest
from unittest.mock import MagicMock


def _table_router(mock_db, responses):
    def table_side_effect(name):
        return responses[name]
    mock_db.table.side_effect = table_side_effect


PNG = b"\x89PNG\r\n\x1a\n" + b"0" * 100


def _published_event(fake_db):
    fake_db.STORE["events"] = [{"id": "event-1", "user_id": "u1", "status": "published"}]


def test_upload_guest_photo_success(fake_db):
    _published_event(fake_db)
    from gallery.service import upload_guest_photo

    result = upload_guest_photo("event-1", "Jamie", "p1.jpg", PNG, "image/jpeg")
    assert result["mime_type"] == "image/png"  # decided from the bytes, not the header
    # stored name is generated server-side: never the client's file name
    assert fake_db.UPLOADS[-1].startswith("gallery/event-1/") and fake_db.UPLOADS[-1].endswith(".png")
    assert "p1" not in fake_db.UPLOADS[-1]


def test_upload_guest_photo_event_not_published(fake_db):
    fake_db.STORE["events"] = [{"id": "event-1", "user_id": "u1", "status": "draft"}]
    from gallery.service import upload_guest_photo

    with pytest.raises(ValueError, match="not accepting photos"):
        upload_guest_photo("event-1", "Jamie", "p1.jpg", PNG, "image/jpeg")


def test_upload_guest_photo_rejects_non_image(fake_db):
    _published_event(fake_db)
    from gallery.service import upload_guest_photo

    with pytest.raises(ValueError, match="Only JPEG"):
        upload_guest_photo("event-1", "Jamie", "clip.mp4", b"\x00\x00\x00\x18ftypisom" + b"0" * 50, "video/mp4")


def test_upload_guest_photo_rejects_scripted_svg_even_if_declared_png(fake_db):
    _published_event(fake_db)
    from gallery.service import upload_guest_photo

    svg = b"<svg xmlns='http://www.w3.org/2000/svg'><script>alert(1)</script></svg>"
    with pytest.raises(ValueError, match="Only JPEG"):
        upload_guest_photo("event-1", "Jamie", "x.png", svg, "image/png")
    assert fake_db.UPLOADS == []


def test_upload_guest_photo_rejects_oversized(fake_db):
    _published_event(fake_db)
    from gallery.service import upload_guest_photo, MAX_IMAGE_BYTES

    with pytest.raises(ValueError, match="too large"):
        upload_guest_photo("event-1", "Jamie", "huge.png", PNG + b"x" * MAX_IMAGE_BYTES, "image/png")


def test_gallery_capacity_is_capped(fake_db):
    _published_event(fake_db)
    from gallery import service
    fake_db.STORE["event_gallery_photos"] = [{"id": str(i), "event_id": "event-1"} for i in range(service.MAX_PHOTOS_PER_EVENT)]
    with pytest.raises(ValueError, match="full"):
        service.upload_guest_photo("event-1", "Jamie", "p.png", PNG, "image/png")


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
