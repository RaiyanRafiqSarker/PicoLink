from datetime import timedelta
from django.test import TestCase, Client
from django.utils import timezone
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import get_user_model
from django.urls import reverse
from shortener.models import URL, LinkClick
from shortener.utils.base62 import encode_base62, decode_base62, SEQUENCE_OFFSET
from shortener.utils.ssrf import validate_url_safety, is_slug_reserved
from shortener.utils.analytics import parse_user_agent, referrer_source

User = get_user_model()

class Base62AndSecurityTestCase(TestCase):
    def test_base62_offset(self):
        # 100,000,000 encodes to 5-char code '6LAze'
        code = encode_base62(SEQUENCE_OFFSET)
        self.assertEqual(code, "6LAze")
        self.assertEqual(decode_base62(code), SEQUENCE_OFFSET)

    def test_reserved_slugs(self):
        self.assertTrue(is_slug_reserved("admin"))
        self.assertTrue(is_slug_reserved("api"))
        self.assertTrue(is_slug_reserved("dashboard"))
        self.assertTrue(is_slug_reserved("health"))
        self.assertTrue(is_slug_reserved("robots.txt"))
        self.assertFalse(is_slug_reserved("my-custom-slug"))

    def test_ssrf_safety(self):
        is_safe, err = validate_url_safety("http://localhost:8000/secret")
        self.assertFalse(is_safe)
        self.assertIn("localhost", err.lower())

        is_safe, err = validate_url_safety("http://127.0.0.1:5000/private")
        self.assertFalse(is_safe)

        is_safe, err = validate_url_safety("ftp://malicious.com/file")
        self.assertFalse(is_safe)

        is_safe, _ = validate_url_safety("https://github.com/django/django")
        self.assertTrue(is_safe)


class ShortenerAPITestCase(TestCase):
    def setUp(self):
        self.client = Client()
        self.superuser = User.objects.create_superuser(
            username="testadmin", email="admin@test.com", password="adminpassword123"
        )

    def test_shorten_url_auto_code(self):
        resp = self.client.post(
            "/api/v1/shorten",
            data={"original_url": "https://www.djangoproject.com"},
            content_type="application/json",
        )
        self.assertEqual(resp.status_code, 201)
        data = resp.json()
        self.assertTrue(len(data["short_code"]) >= 5)
        self.assertIn("short_url", data)

    def test_shorten_url_custom_slug(self):
        resp = self.client.post(
            "/api/v1/shorten",
            data={"original_url": "https://python.org", "custom_slug": "python-lang"},
            content_type="application/json",
        )
        self.assertEqual(resp.status_code, 201)
        data = resp.json()
        self.assertEqual(data["short_code"], "python-lang")

    def test_reserved_slug_rejected(self):
        resp = self.client.post(
            "/api/v1/shorten",
            data={"original_url": "https://python.org", "custom_slug": "dashboard"},
            content_type="application/json",
        )
        self.assertEqual(resp.status_code, 400)

    def test_check_slug_available(self):
        resp = self.client.get("/api/v1/shorten/check-slug/", {"slug": "fresh-slug"})
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(resp.json()["available"], True)

    def test_check_slug_taken(self):
        self.client.post(
            "/api/v1/shorten",
            data={"original_url": "https://python.org", "custom_slug": "taken-slug"},
            content_type="application/json",
        )
        resp = self.client.get("/api/v1/shorten/check-slug/", {"slug": "taken-slug"})
        self.assertEqual(resp.json(), {"slug": "taken-slug", "available": False, "reason": "taken"})

    def test_check_slug_reserved_and_invalid(self):
        resp = self.client.get("/api/v1/shorten/check-slug/", {"slug": "Admin"})
        self.assertEqual(resp.json()["reason"], "reserved")
        self.assertFalse(resp.json()["available"])

        for bad in ["", "ab", "has space", "a" * 51]:
            resp = self.client.get("/api/v1/shorten/check-slug/", {"slug": bad})
            self.assertFalse(resp.json()["available"], bad)
            self.assertEqual(resp.json()["reason"], "invalid", bad)

    def test_redirect_and_stats(self):
        # Shorten
        shorten_resp = self.client.post(
            "/api/v1/shorten",
            data={"original_url": "https://nextjs.org", "custom_slug": "nextjs-docs"},
            content_type="application/json",
        )
        self.assertEqual(shorten_resp.status_code, 201)

        # Redirect (GET /nextjs-docs)
        redirect_resp = self.client.get(
            "/nextjs-docs",
            HTTP_REFERER="https://news.ycombinator.com",
            HTTP_USER_AGENT="TestClient/1.0",
        )
        self.assertEqual(redirect_resp.status_code, 302)
        self.assertEqual(redirect_resp["Location"], "https://nextjs.org")

        # Stats (GET /api/v1/stats/nextjs-docs)
        stats_resp = self.client.get("/api/v1/stats/nextjs-docs")
        self.assertEqual(stats_resp.status_code, 200)
        stats = stats_resp.json()
        self.assertEqual(stats["short_code"], "nextjs-docs")
        self.assertEqual(stats["total_clicks"], 1)
        self.assertEqual(len(stats["top_referrers"]), 1)

    def test_superuser_jwt_auth_and_admin_api(self):
        # 1. Login via JWT
        token_resp = self.client.post(
            "/api/v1/auth/token",
            data={"username": "testadmin", "password": "adminpassword123"},
            content_type="application/json",
        )
        self.assertEqual(token_resp.status_code, 200)
        access_token = token_resp.json()["access"]

        # 2. Get Current User Info
        me_resp = self.client.get(
            "/api/v1/auth/me",
            HTTP_AUTHORIZATION=f"Bearer {access_token}",
        )
        self.assertEqual(me_resp.status_code, 200)
        self.assertTrue(me_resp.json()["is_superuser"])

        # 3. Superuser access admin URLs
        admin_urls_resp = self.client.get(
            "/api/v1/admin/urls",
            HTTP_AUTHORIZATION=f"Bearer {access_token}",
        )
        self.assertEqual(admin_urls_resp.status_code, 200)


class AnalyticsTestCase(TestCase):
    IPHONE_SAFARI = "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1"
    WINDOWS_EDGE = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36 Edg/130.0"
    WINDOWS_CHROME = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36"
    ANDROID_TABLET = "Mozilla/5.0 (Linux; Android 14; SM-X710) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36"

    def test_referrer_source(self):
        self.assertEqual(referrer_source(None), "Direct")
        self.assertEqual(referrer_source(""), "Direct")
        self.assertEqual(referrer_source("https://t.co/abc123"), "Twitter / X")
        self.assertEqual(referrer_source("https://www.linkedin.com/feed/"), "LinkedIn")
        self.assertEqual(referrer_source("https://www.google.co.uk/search?q=x"), "Google")
        self.assertEqual(referrer_source("https://www.example.org/page"), "example.org")
        # "notx.com" must not be mistaken for x.com
        self.assertEqual(referrer_source("https://notx.com/"), "notx.com")

    def test_parse_user_agent(self):
        self.assertEqual(parse_user_agent(self.IPHONE_SAFARI), ("Mobile", "Safari"))
        self.assertEqual(parse_user_agent(self.WINDOWS_EDGE), ("Desktop", "Edge"))
        self.assertEqual(parse_user_agent(self.WINDOWS_CHROME), ("Desktop", "Chrome"))
        self.assertEqual(parse_user_agent(self.ANDROID_TABLET), ("Tablet", "Chrome"))
        self.assertEqual(parse_user_agent("Googlebot/2.1 (+http://www.google.com/bot.html)"), ("Bot", "Bot"))
        self.assertEqual(parse_user_agent(None), ("Unknown", "Unknown"))

    def test_stats_time_series_and_breakdowns(self):
        URL.objects.create(original_url="https://python.org", short_code="charts")
        clicks = [
            (self.IPHONE_SAFARI, "https://t.co/a", 0),
            (self.WINDOWS_EDGE, "https://t.co/b", 0),
            (self.WINDOWS_CHROME, None, 3),
            (self.WINDOWS_CHROME, "https://www.linkedin.com/", 20),
            (self.WINDOWS_CHROME, None, 40),  # outside both windows
        ]
        for ua, ref, days_ago in clicks:
            click = LinkClick.objects.create(short_code="charts", user_agent=ua, referrer=ref)
            LinkClick.objects.filter(pk=click.pk).update(clicked_at=timezone.now() - timedelta(days=days_ago))

        stats = self.client.get("/api/v1/stats/charts").json()

        last_7, last_30 = stats["clicks_last_7_days"], stats["clicks_last_30_days"]
        self.assertEqual(len(last_7), 7)
        self.assertEqual(len(last_30), 30)
        self.assertEqual(last_7[-1], {"date": timezone.now().date().isoformat(), "count": 2})
        self.assertEqual(sum(d["count"] for d in last_7), 3)
        self.assertEqual(sum(d["count"] for d in last_30), 4)

        sources = {s["name"]: s for s in stats["referrer_sources"]}
        self.assertEqual(sources["Twitter / X"]["count"], 2)
        self.assertEqual(sources["Direct"]["percentage"], 40.0)
        devices = {d["name"]: d["count"] for d in stats["device_breakdown"]}
        self.assertEqual(devices, {"Desktop": 4, "Mobile": 1})
        browsers = {b["name"]: b["count"] for b in stats["browser_breakdown"]}
        self.assertEqual(browsers, {"Chrome": 3, "Safari": 1, "Edge": 1})

    def test_stats_with_no_clicks(self):
        URL.objects.create(original_url="https://python.org", short_code="quiet")
        stats = self.client.get("/api/v1/stats/quiet").json()
        self.assertEqual(sum(d["count"] for d in stats["clicks_last_30_days"]), 0)
        self.assertEqual(stats["referrer_sources"], [])
        self.assertEqual(stats["device_breakdown"], [])


class UserLinkEditTestCase(TestCase):
    def setUp(self):
        self.owner = User.objects.create_user(username="owner", password="ownerpass123")
        self.other = User.objects.create_user(username="other", password="otherpass123")
        self.link = URL.objects.create(original_url="https://old.example.com", short_code="editme", created_by=self.owner)

    def auth(self, user):
        return {"HTTP_AUTHORIZATION": f"Bearer {RefreshToken.for_user(user).access_token}"}

    def patch(self, pk, url, user=None):
        headers = self.auth(user) if user else {}
        return self.client.patch(
            f"/api/v1/user/links/{pk}/", data={"original_url": url}, content_type="application/json", **headers
        )

    def test_owner_can_edit_destination_and_redirect_follows(self):
        resp = self.patch(self.link.pk, "https://example.com/new", self.owner)
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(resp.json()["original_url"], "https://example.com/new")
        self.assertEqual(resp.json()["short_code"], "editme")
        self.assertEqual(self.client.get("/editme")["Location"], "https://example.com/new")

    def test_requires_authentication(self):
        self.assertEqual(self.patch(self.link.pk, "https://example.com/new").status_code, 401)

    def test_cannot_edit_someone_elses_link(self):
        resp = self.patch(self.link.pk, "https://example.com/evil", self.other)
        self.assertEqual(resp.status_code, 404)
        self.link.refresh_from_db()
        self.assertEqual(self.link.original_url, "https://old.example.com")

    def test_rejects_unsafe_destination(self):
        resp = self.patch(self.link.pk, "http://127.0.0.1/admin", self.owner)
        self.assertEqual(resp.status_code, 400)

    def test_rejects_expired_and_inactive_links(self):
        URL.objects.filter(pk=self.link.pk).update(expires_at=timezone.now() - timedelta(days=1))
        self.assertEqual(self.patch(self.link.pk, "https://example.com/new", self.owner).status_code, 400)

        URL.objects.filter(pk=self.link.pk).update(expires_at=None, is_active=False)
        self.assertEqual(self.patch(self.link.pk, "https://example.com/new", self.owner).status_code, 400)

    def test_links_list_reports_expiry(self):
        URL.objects.filter(pk=self.link.pk).update(expires_at=timezone.now() - timedelta(days=1))
        results = self.client.get("/api/v1/user/links", **self.auth(self.owner)).json()["results"]
        self.assertEqual(results[0]["is_expired"], True)
