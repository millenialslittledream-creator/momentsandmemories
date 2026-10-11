from unittest.mock import MagicMock, patch

import httpx
import pytest

from middleware import counter


@pytest.fixture
def redis_settings():
    with patch("middleware.counter.settings") as s:
        s.upstash_redis_rest_url = "https://redis.example.upstash.io/"
        s.upstash_redis_rest_token = "tok"
        s.kv_rest_api_url = ""
        s.kv_rest_api_token = ""
        yield s


def _response(results):
    resp = MagicMock()
    resp.json.return_value = [{"result": r} for r in results]
    resp.raise_for_status.return_value = None
    return resp


def test_incr_uses_shared_redis_when_configured(redis_settings):
    with patch("middleware.counter.httpx.post", return_value=_response([3, 1])) as post:
        hits, retry_after = counter.incr("guest-msg:1.2.3.4", 60)

    assert hits == 3 and 1 <= retry_after <= 60
    args, kwargs = post.call_args
    assert args[0] == "https://redis.example.upstash.io/pipeline"      # trailing slash normalised
    assert kwargs["headers"] == {"Authorization": "Bearer tok"}
    incr_cmd, expire_cmd = kwargs["json"]
    assert incr_cmd[0] == "INCR" and incr_cmd[1].startswith("rl:guest-msg:1.2.3.4:")
    assert expire_cmd == ["EXPIRE", incr_cmd[1], 120, "NX"]             # TTL = 2 windows, set once


def test_vercel_kv_variable_names_are_accepted():
    with patch("middleware.counter.settings") as s:
        s.upstash_redis_rest_url = ""
        s.upstash_redis_rest_token = ""
        s.kv_rest_api_url = "https://kv.example"
        s.kv_rest_api_token = "kvtok"
        with patch("middleware.counter.httpx.post", return_value=_response([1, 1])) as post:
            counter.incr("k", 10)
        assert post.call_args[0][0] == "https://kv.example/pipeline"


def test_peek_reads_without_incrementing(redis_settings):
    with patch("middleware.counter.httpx.post", return_value=_response(["7"])) as post:
        assert counter.peek("admin-fail:ip", 600) == 7
    assert post.call_args.kwargs["json"][0][0] == "GET"


def test_peek_of_unseen_key_is_zero(redis_settings):
    with patch("middleware.counter.httpx.post", return_value=_response([None])):
        assert counter.peek("never-seen", 60) == 0


def test_redis_outage_falls_back_to_local_counting(redis_settings):
    with patch("middleware.counter.httpx.post", side_effect=httpx.ConnectTimeout("down")):
        first, _ = counter.incr("fallback-key", 60)
        second, _ = counter.incr("fallback-key", 60)
        assert (first, second) == (1, 2)               # still counting, site not blocked or crashed
        assert counter.peek("fallback-key", 60) == 2


def test_without_redis_config_nothing_leaves_the_process():
    with patch("middleware.counter.settings") as s, patch("middleware.counter.httpx.post") as post:
        s.upstash_redis_rest_url = s.upstash_redis_rest_token = ""
        s.kv_rest_api_url = s.kv_rest_api_token = ""
        assert counter.incr("local-only", 60)[0] == 1
        post.assert_not_called()


def test_endpoint_returns_429_with_retry_after_when_shared_counter_is_over_limit(client, fake_db):
    fake_db.STORE["events"] = [{"id": "00000000-0000-4000-8000-000000000001", "status": "published"}]
    url = "/messaging/events/00000000-0000-4000-8000-000000000001/messages/guest/00000000-0000-4000-8000-000000000002"
    with patch("middleware.counter.incr", return_value=(11, 42)):   # another instance already used the quota
        r = client.post(url, json={"body": "hi"})
    assert r.status_code == 429
    assert r.headers["retry-after"] == "42"


def test_admin_lockout_is_shared_across_instances(client):
    with patch("middleware.auth.settings") as s, patch("middleware.counter.peek", return_value=10):
        s.admin_secret = "a-long-random-admin-secret"
        r = client.get("/admin/users", headers={"X-Admin-Secret": "a-long-random-admin-secret"})
    assert r.status_code == 429


def test_rate_limits_can_be_disabled_for_staging_load_tests(client, fake_db):
    fake_db.STORE["events"] = [{"id": "00000000-0000-4000-8000-000000000001", "status": "published"}]
    fake_db.STORE["event_invitees"] = [{"id": "00000000-0000-4000-8000-000000000002",
                                        "event_id": "00000000-0000-4000-8000-000000000001", "name": "G"}]
    url = "/messaging/events/00000000-0000-4000-8000-000000000001/messages/guest/00000000-0000-4000-8000-000000000002"
    with patch("middleware.ratelimit.settings") as s:
        s.rate_limits_enabled = False
        codes = [client.post(url, json={"body": "hi"}).status_code for _ in range(15)]
    assert set(codes) == {200}      # would be 429 after 10 if limits were on


def test_rate_limits_are_on_by_default():
    from config import Settings
    assert Settings(supabase_url="x", supabase_service_key="x", jwt_secret="x").rate_limits_enabled is True
