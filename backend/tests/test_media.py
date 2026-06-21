import pytest
from unittest.mock import MagicMock


def test_upload_image(mock_db):
    mock_db.storage.from_.return_value.get_public_url.return_value = "https://example.com/u/abc.png"
    mock_db.table.return_value.insert.return_value.execute.return_value = MagicMock(
        data=[{"id": "media-123", "storage_path": "user-1/abc.png", "public_url": "https://example.com/u/abc.png",
               "kind": "image", "mime_type": "image/png", "file_size_bytes": 100, "created_at": "now"}]
    )

    from media.service import upload_media

    result = upload_media("user-1", "abc.png", b"x" * 100, "image/png")
    assert result["kind"] == "image"
    mock_db.storage.from_.return_value.upload.assert_called_once()


def test_upload_video(mock_db):
    mock_db.storage.from_.return_value.get_public_url.return_value = "https://example.com/u/clip.mp4"
    mock_db.table.return_value.insert.return_value.execute.return_value = MagicMock(
        data=[{"id": "media-456", "storage_path": "user-1/clip.mp4", "public_url": "https://example.com/u/clip.mp4",
               "kind": "video", "mime_type": "video/mp4", "file_size_bytes": 200, "created_at": "now"}]
    )

    from media.service import upload_media

    result = upload_media("user-1", "clip.mp4", b"x" * 200, "video/mp4")
    assert result["kind"] == "video"


def test_upload_rejects_unsupported_type(mock_db):
    from media.service import upload_media

    with pytest.raises(ValueError, match="Unsupported file type"):
        upload_media("user-1", "doc.pdf", b"x", "application/pdf")


def test_upload_rejects_oversized_image(mock_db):
    from media.service import upload_media, MAX_IMAGE_BYTES

    with pytest.raises(ValueError, match="too large"):
        upload_media("user-1", "huge.png", b"x" * (MAX_IMAGE_BYTES + 1), "image/png")


def test_delete_media_not_found(mock_db):
    mock_db.table.return_value.select.return_value.eq.return_value.eq.return_value.execute.return_value = MagicMock(
        data=[]
    )

    from media.service import delete_media

    with pytest.raises(ValueError, match="not found"):
        delete_media("user-1", "missing-id")


def test_delete_media_success(mock_db):
    mock_db.table.return_value.select.return_value.eq.return_value.eq.return_value.execute.return_value = MagicMock(
        data=[{"id": "media-123", "storage_path": "user-1/abc.png"}]
    )

    from media.service import delete_media

    delete_media("user-1", "media-123")
    mock_db.storage.from_.return_value.remove.assert_called_once_with(["user-1/abc.png"])


def test_list_media(mock_db):
    chain = mock_db.table.return_value.select.return_value.eq.return_value.order.return_value.limit.return_value.offset.return_value
    chain.execute.return_value = MagicMock(data=[{"id": "media-1"}, {"id": "media-2"}])

    from media.service import list_media

    result = list_media("user-1")
    assert len(result) == 2
