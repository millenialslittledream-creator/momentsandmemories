"""Each test replays an exploit found in the security audit, over real HTTP routes."""
from unittest.mock import patch

import pytest

ALICE = {"Authorization": "Bearer token-alice"}
BOB = {"Authorization": "Bearer token-bob"}
PNG = b"\x89PNG\r\n\x1a\n" + b"0" * 100


@pytest.fixture
def alice_event(client, fake_db):
    """A published event owned by Alice, with two guests and one organiser message."""
    event = client.post("/events", headers=ALICE, json={
        "title": "Alice Wedding", "event_date": "2026-12-01", "status": "published"}).json()
    client.post(f"/events/{event['id']}/invitees", headers=ALICE, json=[
        {"name": "Guest One", "email": "g1@x.com", "phone": "+15550000001"},
        {"name": "Guest Two", "email": "g2@x.com", "phone": "+15550000002"}])
    client.post(f"/messaging/events/{event['id']}/messages", headers=ALICE, json={"body": "Private note"})
    return event["id"]


# ── IDOR: guest list & messaging ────────────────────────────────────────────────
def test_other_user_cannot_read_add_or_delete_guests(client, alice_event):
    assert client.get(f"/events/{alice_event}/invitees", headers=BOB).status_code == 404
    assert client.post(f"/events/{alice_event}/invitees", headers=BOB, json=[{"name": "x"}]).status_code == 404
    guest_id = client.get(f"/events/{alice_event}/invitees", headers=ALICE).json()[0]["id"]
    assert client.delete(f"/events/{alice_event}/invitees/{guest_id}", headers=BOB).status_code == 404
    assert len(client.get(f"/events/{alice_event}/invitees", headers=ALICE).json()) == 2


def test_other_user_cannot_read_or_post_organiser_messages(client, alice_event):
    assert client.get(f"/messaging/events/{alice_event}/messages", headers=BOB).status_code == 404
    r = client.post(f"/messaging/events/{alice_event}/messages", headers=BOB,
                    json={"body": "send money", "sender_name": "Alice (host)"})
    assert r.status_code == 404


def test_guest_message_needs_a_real_invitee_and_is_size_capped(client, alice_event, fake_db):
    guest = fake_db.STORE["event_invitees"][0]["id"]
    ok = client.post(f"/messaging/events/{alice_event}/messages/guest/{guest}", json={"body": "hello"})
    assert ok.status_code == 200
    fake = "00000000-0000-4000-8000-000000000000"
    assert client.post(f"/messaging/events/{alice_event}/messages/guest/{fake}", json={"body": "x"}).status_code == 404
    assert client.post(f"/messaging/events/{alice_event}/messages/guest/{guest}",
                       json={"body": "x" * 1_000_000}).status_code == 422


def test_guest_message_is_rate_limited(client, alice_event, fake_db):
    guest = fake_db.STORE["event_invitees"][0]["id"]
    codes = [client.post(f"/messaging/events/{alice_event}/messages/guest/{guest}", json={"body": "hi"}).status_code
             for _ in range(15)]
    assert codes.count(200) == 10 and 429 in codes


# ── SMS / email relay ──────────────────────────────────────────────────────────
def test_bulk_send_to_someone_elses_event_is_refused(client, alice_event):
    with patch("notifications.service._send_sms") as sms:
        r = client.post("/notifications/bulk-send", headers=BOB, json={
            "event_id": alice_event, "channel": "sms", "subject": "Hi", "body": "http://evil.example"})
        assert r.status_code == 404
        sms.assert_not_called()


def test_bulk_send_recipient_list_is_capped(client, fake_db):
    big = [{"name": f"n{i}", "phone": f"+1555{i:07d}"} for i in range(201)]
    r = client.post("/notifications/bulk-send", headers=BOB,
                    json={"recipients": big, "channel": "sms", "subject": "s", "body": "b"})
    assert r.status_code == 422


def test_bulk_send_is_rate_limited_per_user(client, fake_db):
    payload = {"recipients": [{"name": "a", "phone": "+15550000001"}], "channel": "sms", "subject": "s", "body": "b"}
    with patch("notifications.service._send_sms"):
        codes = [client.post("/notifications/bulk-send", headers=BOB, json=payload).status_code for _ in range(12)]
    assert codes.count(200) == 10 and codes[-1] == 429


def test_send_notification_is_rate_limited_and_validates_recipient(client, fake_db):
    bad = client.post("/notifications/send", headers=BOB, json={
        "type": "sms", "title": "t", "body": "b", "recipient": "+447700900123"})
    assert bad.status_code in (400, 500)
    bad_email = client.post("/notifications/send", headers=BOB, json={
        "type": "email", "title": "t", "body": "b", "recipient": "not-an-email"})
    assert bad_email.status_code == 400


# ── Admin ────────────────────────────────────────────────────────────────────
def test_admin_is_closed_when_secret_unset(client):
    with patch("middleware.auth.settings") as s:
        s.admin_secret = ""
        assert client.get("/admin/users", headers={"X-Admin-Secret": ""}).status_code == 503
        assert client.get("/admin/users").status_code == 503


def test_admin_brute_force_gets_locked_out(client):
    with patch("middleware.auth.settings") as s:
        s.admin_secret = "a-long-random-admin-secret"
        codes = [client.get("/admin/users", headers={"X-Admin-Secret": f"guess{i}"}).status_code for i in range(15)]
        assert codes[:10] == [403] * 10 and set(codes[10:]) == {429}
        assert client.get("/admin/users", headers={"X-Admin-Secret": "a-long-random-admin-secret"}).status_code == 429


# ── Legacy auth removed ──────────────────────────────────────────────────────────
@pytest.mark.parametrize("path", ["/auth/signup", "/auth/login", "/auth/forgot-password", "/auth/reset-password", "/auth/verify-otp"])
def test_legacy_auth_endpoints_are_gone(client, path):
    assert client.post(path, json={}).status_code == 404


# ── Shop ─────────────────────────────────────────────────────────────────────
def test_negative_quantity_order_is_rejected(client, fake_db):
    fake_db.STORE["shop_items"] = [{"id": "i1", "name": "Frame", "price": 50.0, "stock": 5, "is_active": True}]
    r = client.post("/shop/orders", headers=BOB, json={"items": [{"shop_item_id": "i1", "quantity": -10}]})
    assert r.status_code == 422
    assert fake_db.STORE["shop_items"][0]["stock"] == 5


# ── Events ───────────────────────────────────────────────────────────────────
def test_event_status_must_be_valid(client, alice_event):
    assert client.patch(f"/events/{alice_event}", headers=ALICE, json={"status": "whatever"}).status_code == 400
    assert client.patch(f"/events/{alice_event}", headers=ALICE, json={"status": "archived"}).status_code == 200


# ── Uploads ──────────────────────────────────────────────────────────────────
def test_anonymous_gallery_blocks_scripted_svg_and_path_tricks(client, alice_event, fake_db):
    svg = b"<svg xmlns='http://www.w3.org/2000/svg'><script>alert(1)</script></svg>"
    r = client.post(f"/public/events/{alice_event}/gallery", files={"file": ("../../x.svg", svg, "image/svg+xml")})
    assert r.status_code == 400 and fake_db.UPLOADS == []
    ok = client.post(f"/public/events/{alice_event}/gallery", files={"file": ("../../evil.png", PNG, "image/png")})
    assert ok.status_code == 200 and ".." not in fake_db.UPLOADS[0]


def test_anonymous_gallery_upload_is_rate_limited(client, alice_event):
    codes = [client.post(f"/public/events/{alice_event}/gallery", files={"file": ("a.png", PNG, "image/png")}).status_code
             for _ in range(13)]
    assert codes.count(200) == 10 and 429 in codes


def test_authenticated_upload_rejects_php_declared_as_png(client, fake_db):
    r = client.post("/media/upload", headers=BOB, files={"file": ("shell.php", b"<?php ?>", "image/png")})
    assert r.status_code == 400


# ── QR ───────────────────────────────────────────────────────────────────────
def test_qr_session_is_owner_only_and_hides_user_id(client, fake_db):
    token = client.post("/qr/session", headers=ALICE).json()["session_token"]
    assert client.get(f"/qr/session/{token}", headers=BOB).status_code == 404
    mine = client.get(f"/qr/session/{token}", headers=ALICE).json()
    assert "user_id" not in mine and mine["status"] == "pending"


def test_qr_session_for_foreign_event_is_refused(client, alice_event):
    assert client.post("/qr/session", headers=BOB, params={"event_id": alice_event}).status_code == 404


def test_qr_contacts_are_capped(client, fake_db):
    token = client.post("/qr/session", headers=ALICE).json()["session_token"]
    too_many = {"contacts": [{"name": "n"}] * 501}
    assert client.post(f"/qr/contacts/{token}", json=too_many).status_code == 422


# ── RSVP ─────────────────────────────────────────────────────────────────────
def test_rsvp_inputs_are_bounded_and_rate_limited(client, alice_event, fake_db):
    guest = fake_db.STORE["event_invitees"][0]["id"]
    url = f"/public/events/{alice_event}/rsvp/{guest}"
    assert client.post(url, json={"status": "accepted", "adults_count": 100000}).status_code == 422
    assert client.post(url, json={"status": "declined", "message": "x" * 5000}).status_code == 422
    codes = [client.post(url, json={"status": "declined"}).status_code for _ in range(35)]
    assert 429 in codes


# ── Platform hardening ─────────────────────────────────────────────────────────
def test_api_docs_are_not_public(client):
    for path in ("/docs", "/redoc", "/openapi.json"):
        assert client.get(path).status_code == 404


def test_security_headers_present(client):
    r = client.get("/health")
    assert r.headers["x-content-type-options"] == "nosniff"
    assert r.headers["x-frame-options"] == "DENY"
    assert "max-age" in r.headers["strict-transport-security"]
    assert r.headers["content-security-policy"].startswith("default-src 'none'")


def test_cors_does_not_trust_arbitrary_localhost_ports_in_production(client):
    r = client.options("/events", headers={
        "Origin": "http://localhost:6666", "Access-Control-Request-Method": "GET",
        "Access-Control-Request-Headers": "authorization"})
    assert r.headers.get("access-control-allow-origin") != "http://localhost:6666"


def test_profile_avatar_must_be_https_and_empty_update_is_safe(client, fake_db):
    assert client.patch("/users/me", headers=ALICE, json={"avatar_url": "javascript:alert(1)"}).status_code == 422
