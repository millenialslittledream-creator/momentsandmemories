"""Unpublish / re-publish / delete an evite from the dashboard: who may do it and what guests see."""
ALICE = {"Authorization": "Bearer token-alice"}
BOB = {"Authorization": "Bearer token-bob"}


def _published_event(client, fake_db):
    event = client.post("/events", headers=ALICE, json={
        "title": "Ana & Ben", "event_date": "2026-12-01", "status": "published"}).json()
    client.post(f"/events/{event['id']}/invitees", headers=ALICE, json=[{"name": "Guest", "email": "g@x.com"}])
    return event["id"]


def test_unpublish_hides_the_public_page_and_closes_rsvp_then_publish_restores_it(client, fake_db):
    event_id = _published_event(client, fake_db)
    guest_id = fake_db.STORE["event_invitees"][0]["id"]
    assert client.get(f"/public/events/{event_id}").status_code == 200

    assert client.patch(f"/events/{event_id}", headers=ALICE, json={"status": "draft"}).status_code == 200
    assert client.get(f"/public/events/{event_id}").status_code == 404
    rsvp = client.post(f"/public/events/{event_id}/rsvp/{guest_id}", json={"status": "declined"})
    assert rsvp.status_code == 400                      # RSVPs are closed while it is private
    assert len(client.get(f"/events/{event_id}/invitees", headers=ALICE).json()) == 1   # guest list is kept

    assert client.patch(f"/events/{event_id}", headers=ALICE, json={"status": "published"}).status_code == 200
    assert client.get(f"/public/events/{event_id}").status_code == 200


def test_only_the_owner_can_unpublish_or_delete(client, fake_db):
    event_id = _published_event(client, fake_db)
    assert client.patch(f"/events/{event_id}", headers=BOB, json={"status": "draft"}).status_code == 404
    assert client.delete(f"/events/{event_id}", headers=BOB).status_code == 404
    assert client.get(f"/public/events/{event_id}").status_code == 200      # untouched


def test_owner_can_delete_and_the_public_link_stops_working(client, fake_db):
    event_id = _published_event(client, fake_db)
    r = client.delete(f"/events/{event_id}", headers=ALICE)
    assert r.status_code == 200 and r.json() == {"deleted": True}
    assert client.get(f"/public/events/{event_id}").status_code == 404
    assert client.get(f"/events/{event_id}", headers=ALICE).status_code == 404
    assert client.delete(f"/events/{event_id}", headers=ALICE).status_code == 404    # already gone


def test_delete_requires_sign_in(client, fake_db):
    event_id = _published_event(client, fake_db)
    assert client.delete(f"/events/{event_id}").status_code == 401
    assert client.patch(f"/events/{event_id}", json={"status": "draft"}).status_code == 401
