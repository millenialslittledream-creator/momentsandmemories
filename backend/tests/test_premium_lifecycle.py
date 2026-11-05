"""Unpublish / publish / delete a premium website from the dashboard: who may, and what visitors see."""
ALICE = {"Authorization": "Bearer token-alice"}
BOB = {"Authorization": "Bearer token-bob"}


def _site(client, slug="ana-ben"):
    r = client.post("/premium-websites", headers=ALICE, json={
        "slug": slug, "event_key": "marriage", "design_id": "d1", "theme_id": "t1",
        "content": {"hero": "https://cdn.example/a.jpg"}, "published": True})
    assert r.status_code == 200
    return r.json()["id"]


def test_unpublish_hides_the_public_page_and_publish_brings_it_back(client, fake_db):
    site_id = _site(client)
    assert client.get("/public/premium-sites/ana-ben").status_code == 200

    assert client.put(f"/premium-websites/{site_id}", headers=ALICE, json={"published": False}).status_code == 200
    assert client.get("/public/premium-sites/ana-ben").status_code == 404
    listed = client.get("/premium-websites", headers=ALICE).json()
    assert [s["published"] for s in listed] == [False]          # still in the host's dashboard list

    assert client.put(f"/premium-websites/{site_id}", headers=ALICE, json={"published": True}).status_code == 200
    assert client.get("/public/premium-sites/ana-ben").status_code == 200


def test_only_the_owner_can_unpublish_or_delete(client, fake_db):
    site_id = _site(client)
    assert client.put(f"/premium-websites/{site_id}", headers=BOB, json={"published": False}).status_code == 404
    assert client.delete(f"/premium-websites/{site_id}", headers=BOB).status_code == 404
    assert client.get("/public/premium-sites/ana-ben").status_code == 200
    assert client.get("/premium-websites", headers=BOB).json() == []      # not listed for other people


def test_owner_can_delete_and_the_link_stops_working(client, fake_db):
    site_id = _site(client)
    r = client.delete(f"/premium-websites/{site_id}", headers=ALICE)
    assert r.status_code == 200 and r.json() == {"status": "deleted"}
    assert client.get("/public/premium-sites/ana-ben").status_code == 404
    assert client.get("/premium-websites", headers=ALICE).json() == []
    assert client.delete(f"/premium-websites/{site_id}", headers=ALICE).status_code == 404    # already gone


def test_deleting_frees_the_link_name_for_reuse(client, fake_db):
    site_id = _site(client)
    client.delete(f"/premium-websites/{site_id}", headers=ALICE)
    again = client.post("/premium-websites", headers=ALICE, json={
        "slug": "ana-ben", "event_key": "marriage", "design_id": "d1", "theme_id": "t1", "content": {}})
    assert again.status_code == 200


def test_requires_sign_in(client, fake_db):
    site_id = _site(client)
    assert client.delete(f"/premium-websites/{site_id}").status_code == 401
    assert client.put(f"/premium-websites/{site_id}", json={"published": False}).status_code == 401
    assert client.get("/premium-websites").status_code == 401
