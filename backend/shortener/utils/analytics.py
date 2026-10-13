import re
from collections import Counter
from datetime import timedelta
from urllib.parse import urlparse

from django.db.models import Count
from django.db.models.functions import TruncDate
from django.utils import timezone

from .bots import is_bot_user_agent

# Hostname suffix -> friendly source name (checked in order)
REFERRER_SOURCES = [
    (("t.co", "twitter.com", "x.com"), "Twitter / X"),
    (("linkedin.com", "lnkd.in"), "LinkedIn"),
    (("facebook.com", "fb.com", "fb.me"), "Facebook"),
    (("instagram.com",), "Instagram"),
    (("reddit.com",), "Reddit"),
    (("youtube.com", "youtu.be"), "YouTube"),
    (("github.com",), "GitHub"),
    (("slack.com",), "Slack"),
    (("whatsapp.com", "wa.me"), "WhatsApp"),
    (("bing.com",), "Bing"),
    (("duckduckgo.com",), "DuckDuckGo"),
]



def referrer_source(referrer: str | None) -> str:
    """Map a raw Referer header to a source name such as "Twitter / X", "Direct" or the bare domain."""
    if not referrer:
        return "Direct"
    host = (urlparse(referrer).hostname or "").lower()
    if not host:
        return "Direct"
    for suffixes, name in REFERRER_SOURCES:
        if any(host == s or host.endswith("." + s) for s in suffixes):
            return name
    if re.search(r"(^|\.)google\.[a-z.]+$", host):
        return "Google"
    return host.removeprefix("www.")


def parse_user_agent(user_agent: str | None) -> tuple[str, str]:
    """Return (device, browser) for a User-Agent string, e.g. ("Mobile", "Safari")."""
    if not user_agent:
        return "Unknown", "Unknown"
    if is_bot_user_agent(user_agent):
        return "Bot", "Bot"

    if re.search(r"iPad|Tablet", user_agent) or ("Android" in user_agent and "Mobile" not in user_agent):
        device = "Tablet"
    elif re.search(r"Mobi|iPhone|iPod|Android", user_agent):
        device = "Mobile"
    else:
        device = "Desktop"

    # Order matters: Edge/Opera/Samsung UAs also contain "Chrome", and Chrome UAs contain "Safari"
    if "Edg" in user_agent:
        browser = "Edge"
    elif "OPR/" in user_agent or "Opera" in user_agent:
        browser = "Opera"
    elif "SamsungBrowser" in user_agent:
        browser = "Samsung Internet"
    elif "Firefox" in user_agent or "FxiOS" in user_agent:
        browser = "Firefox"
    elif "Chrome" in user_agent or "CriOS" in user_agent:
        browser = "Chrome"
    elif "Safari" in user_agent:
        browser = "Safari"
    else:
        browser = "Other"
    return device, browser


def percentage_breakdown(counts: Counter) -> list[dict]:
    """Turn {"name": count} into [{"name", "count", "percentage"}] sorted by count, percentages to 1 dp."""
    total = sum(counts.values())
    return [
        {"name": name, "count": count, "percentage": round(count * 100 / total, 1)}
        for name, count in counts.most_common()
    ] if total else []


def daily_click_series(clicks_qs, days: int) -> list[dict]:
    """Clicks per UTC day for the last `days` days (including today), with zero-filled gaps."""
    today = timezone.now().date()
    start = today - timedelta(days=days - 1)
    per_day = {
        row["date"]: row["count"]
        for row in clicks_qs.filter(clicked_at__date__gte=start)
        .annotate(date=TruncDate("clicked_at"))
        .values("date")
        .annotate(count=Count("id"))
    }
    return [
        {"date": (start + timedelta(days=i)).isoformat(), "count": per_day.get(start + timedelta(days=i), 0)}
        for i in range(days)
    ]


def referrer_and_device_breakdowns(clicks_qs) -> dict:
    """Referrer sources, devices and browsers as percentage breakdowns.

    Groups by the raw header first so each distinct string is parsed once, not once per click.
    """
    sources = Counter()
    for row in clicks_qs.values("referrer").annotate(count=Count("id")):
        sources[referrer_source(row["referrer"])] += row["count"]

    devices, browsers = Counter(), Counter()
    for row in clicks_qs.values("user_agent").annotate(count=Count("id")):
        device, browser = parse_user_agent(row["user_agent"])
        devices[device] += row["count"]
        browsers[browser] += row["count"]

    return {
        "referrer_sources": percentage_breakdown(sources),
        "device_breakdown": percentage_breakdown(devices),
        "browser_breakdown": percentage_breakdown(browsers),
    }
