"""Upload validation shared by authenticated media uploads and anonymous gallery uploads.

The client-supplied Content-Type and filename are never trusted: the real type is decided
from the file's magic bytes, and the stored filename is generated server-side.
"""
from typing import Optional

IMAGE_TYPES = {"image/jpeg": ".jpg", "image/png": ".png", "image/gif": ".gif", "image/webp": ".webp"}
VIDEO_TYPES = {"video/mp4": ".mp4", "video/quicktime": ".mov"}
_MP4_BRANDS = {b"isom", b"iso2", b"mp41", b"mp42", b"avc1", b"M4V ", b"dash"}


def sniff_media_type(content: bytes) -> Optional[str]:
    """Return a safe MIME type from file signature, or None if not an allowed image/video."""
    if content.startswith(b"\x89PNG\r\n\x1a\n"):
        return "image/png"
    if content[:3] == b"\xff\xd8\xff":
        return "image/jpeg"
    if content[:6] in (b"GIF87a", b"GIF89a"):
        return "image/gif"
    if content[:4] == b"RIFF" and content[8:12] == b"WEBP":
        return "image/webp"
    if content[4:8] == b"ftyp":
        brand = content[8:12]
        if brand == b"qt  ":
            return "video/quicktime"
        if brand in _MP4_BRANDS:
            return "video/mp4"
    return None


def extension_for(mime_type: str) -> str:
    return {**IMAGE_TYPES, **VIDEO_TYPES}[mime_type]
