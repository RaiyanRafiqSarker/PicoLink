from django.test import TestCase, Client
from django.contrib.auth import get_user_model
from django.urls import reverse
from shortener.models import URL, LinkClick
from shortener.utils.base62 import encode_base62, decode_base62, SEQUENCE_OFFSET
from shortener.utils.ssrf import validate_url_safety, is_slug_reserved

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
