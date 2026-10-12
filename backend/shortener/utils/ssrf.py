import ipaddress
import socket
from urllib.parse import urlparse

RESERVED_SLUGS = {
    "api",
    "admin",
    "health",
    "healthz",
    "dashboard",
    "login",
    "logout",
    "register",
    "auth",
    "static",
    "media",
    "favicon.ico",
    "robots.txt",
    "sitemap.xml",
}

def is_private_ip(ip_str: str) -> bool:
    try:
        ip = ipaddress.ip_address(ip_str)
        return (
            ip.is_private
            or ip.is_loopback
            or ip.is_link_local
            or ip.is_reserved
            or ip.is_multicast
            or ip.is_unspecified
        )
    except ValueError:
        return False

def validate_url_safety(target_url: str, server_domain: str = "") -> tuple[bool, str]:
    """
    Validates URL to protect against SSRF, loopback access,
    internal network scanning, and invalid protocols.
    """
    if not target_url or not isinstance(target_url, str):
        return False, "Target URL is required."

    target_url = target_url.strip()
    try:
        parsed = urlparse(target_url)
    except Exception:
        return False, "Invalid URL structure."

    if parsed.scheme not in ("http", "https"):
        return False, "Only HTTP and HTTPS protocols are permitted."

    hostname = parsed.hostname
    if not hostname:
        return False, "URL hostname cannot be empty."

    hostname_lower = hostname.lower()

    if hostname_lower in ("localhost", "127.0.0.1", "::1", "0.0.0.0"):
        return False, "Target URL cannot point to localhost or loopback address."

    if server_domain and hostname_lower == server_domain.lower():
        return False, "Target URL cannot point to this URL Shortener domain."

    # Direct IP validation
    if is_private_ip(hostname_lower):
        return False, "Target URL points to a private or restricted IP address."

    # DNS Resolution check
    try:
        addr_info = socket.getaddrinfo(hostname, None)
        for entry in addr_info:
            ip = entry[4][0]
            if is_private_ip(ip):
                return False, "Target URL resolves to a private or restricted IP address."
    except socket.gaierror:
        # If DNS fails to resolve completely, we can either reject or allow if public
        return False, f"Could not resolve domain: {hostname}"
    except Exception:
        pass

    return True, ""

def is_slug_reserved(slug: str) -> bool:
    return slug.strip().lower() in RESERVED_SLUGS
