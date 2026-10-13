import re

# Crawlers and link-preview fetchers we explicitly filter (matched case-insensitively anywhere in the UA)
KNOWN_BOT_SIGNATURES = (
    "googlebot",
    "bingbot",
    "twitterbot",
    "facebookexternalhit",
    "linkedinbot",
    "slackbot",
    "slack-imgproxy",
    "applebot",
    "duckduckbot",
    "yandexbot",
    "baiduspider",
    "discordbot",
    "telegrambot",
    "whatsapp",
    "ahrefsbot",
    "semrushbot",
    "petalbot",
    "gptbot",
    # Scripts and HTTP libraries
    "curl/",
    "wget/",
    "python-requests",
    "python-urllib",
    "go-http-client",
    "okhttp",
    "headlesschrome",
)

# Generic crawler naming convention, e.g. "SomeBot/1.0", "MyCrawler/2.3", "Spider/1.0".
# Requiring the "/version" avoids false positives like the "CUBOT" phone brand.
GENERIC_BOT_PATTERN = re.compile(r"[a-z]*(bot|crawler|spider)/\d", re.I)


def is_bot_user_agent(user_agent: str | None) -> bool:
    """True if the User-Agent belongs to a known crawler, preview bot or script."""
    if not user_agent:
        return False
    ua = user_agent.lower()
    return any(sig in ua for sig in KNOWN_BOT_SIGNATURES) or bool(GENERIC_BOT_PATTERN.search(user_agent))
