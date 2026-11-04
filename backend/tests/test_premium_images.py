"""Premium design images must live in Supabase Storage, not in the author's browser."""
import pytest

ALICE = {"Authorization": "Bearer token-alice"}
ALICE_ID = "11111111-1111-1111-1111-111111111111"
PNG = b"\x89PNG\r\n\x1a\n" + b"0" * 100
JPEG = b"\xff\xd8\xff\xe0" + b"0" * 100


def _site(slug="our-day", **content):
    return {"slug": slug, "event_key": "marriage", "design_id": "d1", "theme_id": "t1",
            "content": content, "published": True}


def test_upload_goes_to_premium_bucket_under_the_users_folder(client, fake_db):
    r = client.post("/premium-websites/images", headers=ALICE, files={"file": ("photo.png", PNG, "image/png")})
    assert r.status_code == 200
    body = r.json()
    assert fake_db.UPLOAD_BUCKETS == ["premium-site-media"]
    assert body["storage_path"].startswith(f"{ALICE_ID}/") and body["storage_path"].endswith(".png")
    assert body["public_url"] == f"https://fake.storage/{body['storage_path']}"
    assert "photo" not in body["storage_path"]          # client file name is never used


def test_type_comes_from_the_bytes_not_the_header(client, fake_db):
    ok = client.post("/premium-websites/images", headers=ALICE, files={"file": ("x.bin", JPEG, "application/octet-stream")})
    assert ok.status_code == 200 and ok.json()["storage_path"].endswith(".jpg")
    svg = b"<svg xmlns='http://www.w3.org/2000/svg'><script>alert(1)</script></svg>"
    for name, data, declared in [("a.svg", svg, "image/svg+xml"), ("a.png", b"<?php ?>", "image/png"),
                                 ("a.png", b"GIF", "image/png")]:
        r = client.post("/premium-websites/images", headers=ALICE, files={"file": (name, data, declared)})
        assert r.status_code == 400, name
    assert len(fake_db.UPLOADS) == 1


def test_oversized_image_is_refused(client, fake_db):
    from premium_websites.service import MAX_IMAGE_BYTES
    r = client.post("/premium-websites/images", headers=ALICE,
                    files={"file": ("big.png", PNG + b"x" * MAX_IMAGE_BYTES, "image/png")})
    assert r.status_code == 400 and fake_db.UPLOADS == []


def test_upload_requires_sign_in(client):
    r = client.post("/premium-websites/images", files={"file": ("a.png", PNG, "image/png")})
    assert r.status_code == 401


def test_upload_is_rate_limited_per_user(client):
    codes = [client.post("/premium-websites/images", headers=ALICE,
                         files={"file": ("a.png", PNG, "image/png")}).status_code for _ in range(62)]
    assert codes.count(200) == 60 and 429 in codes


def test_site_with_a_browser_only_blob_url_cannot_be_published(client, fake_db):
    r = client.post("/premium-websites", headers=ALICE, json=_site(hero="blob:http://localhost:5173/abc-123"))
    assert r.status_code == 400 and "not uploaded" in r.json()["detail"]
    assert fake_db.STORE.get("premium_websites", []) == []


def test_blob_url_is_caught_when_nested_and_on_update(client, fake_db):
    nested = _site(gallery=[{"src": "https://fake.storage/ok.jpg"}, {"src": "blob:https://x/1"}])
    assert client.post("/premium-websites", headers=ALICE, json=nested).status_code == 400
    created = client.post("/premium-websites", headers=ALICE, json=_site(hero="https://fake.storage/ok.jpg"))
    assert created.status_code == 200
    bad = client.put(f"/premium-websites/{created.json()['id']}", headers=ALICE,
                     json={"content": {"hero": "BLOB:http://localhost/1"}})
    assert bad.status_code == 400


def test_site_with_uploaded_public_urls_publishes_and_is_visible_publicly(client, fake_db):
    url = client.post("/premium-websites/images", headers=ALICE,
                      files={"file": ("p.png", PNG, "image/png")}).json()["public_url"]
    created = client.post("/premium-websites", headers=ALICE, json=_site(hero=url))
    assert created.status_code == 200
    public = client.get("/public/premium-sites/our-day")          # no auth: what a guest sees
    assert public.status_code == 200
    assert public.json()["content"]["hero"] == url and url.startswith("https://")


def test_oversized_content_is_refused(client):
    r = client.post("/premium-websites", headers=ALICE, json=_site(blob_of_text="x" * 1_100_000))
    assert r.status_code == 400 and "too large" in r.json()["detail"]


def test_updating_someone_elses_or_missing_site_is_404_not_400(client):
    r = client.put("/premium-websites/00000000-0000-4000-8000-000000000000", headers=ALICE, json={"slug": "x"})
    assert r.status_code == 404


def test_bucket_is_created_on_first_use_with_public_image_only_settings(client, fake_db):
    fake_db.MISSING_BUCKETS.add("premium-site-media")           # fresh project: bucket not created yet
    r = client.post("/premium-websites/images", headers=ALICE, files={"file": ("a.png", PNG, "image/png")})
    assert r.status_code == 200
    (name, options), = fake_db.CREATED_BUCKETS
    assert name == "premium-site-media" and options["public"] is True
    assert options["file_size_limit"] == 10 * 1024 * 1024
    assert set(options["allowed_mime_types"]) == {"image/jpeg", "image/png", "image/webp", "image/gif"}
    assert len(fake_db.UPLOADS) == 1
    # second upload: bucket exists now, nothing is created again
    assert client.post("/premium-websites/images", headers=ALICE,
                       files={"file": ("b.png", PNG, "image/png")}).status_code == 200
    assert len(fake_db.CREATED_BUCKETS) == 1


def test_other_storage_errors_are_not_masked_by_bucket_creation(client, fake_db):
    from unittest.mock import patch
    with patch("premium_websites.service._ensure_bucket") as ensure, \
         patch("tests.fakedb._Bucket.upload", side_effect=Exception("quota exceeded")):
        with pytest.raises(Exception, match="quota exceeded"):
            client.post("/premium-websites/images", headers=ALICE, files={"file": ("a.png", PNG, "image/png")})
    ensure.assert_not_called()
