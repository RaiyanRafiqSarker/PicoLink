import dns from 'dns/promises';
import net from 'net';
import { config } from '../config/index.js';

interface IpRange {
  start: bigint;
  end: bigint;
}

function ipv4ToBigInt(ip: string): bigint {
  const parts = ip.split('.').map(p => BigInt(parseInt(p, 10)));
  return (parts[0] << 24n) | (parts[1] << 16n) | (parts[2] << 8n) | parts[3];
}

function parseCidrV4(cidr: string): IpRange {
  const [ip, bitsStr] = cidr.split('/');
  const bits = BigInt(parseInt(bitsStr, 10));
  const base = ipv4ToBigInt(ip);
  const mask = ((1n << bits) - 1n) << (32n - bits);
  const start = base & mask;
  const end = start | ((1n << (32n - bits)) - 1n);
  return { start, end };
}

const PRIVATE_V4_RANGES: IpRange[] = [
  parseCidrV4('0.0.0.0/8'),        // Current network
  parseCidrV4('10.0.0.0/8'),       // RFC 1918 Private
  parseCidrV4('100.64.0.0/10'),    // Shared address space (CGNAT)
  parseCidrV4('127.0.0.0/8'),      // Loopback
  parseCidrV4('169.254.0.0/16'),   // Link-local (Cloud metadata e.g. AWS/GCP)
  parseCidrV4('172.16.0.0/12'),    // RFC 1918 Private
  parseCidrV4('192.0.0.0/24'),     // IETF Protocol assignments
  parseCidrV4('192.0.2.0/24'),     // TEST-NET-1 documentation
  parseCidrV4('192.168.0.0/16'),   // RFC 1918 Private
  parseCidrV4('198.18.0.0/15'),    // Network benchmark tests
  parseCidrV4('198.51.100.0/24'),  // TEST-NET-2 documentation
  parseCidrV4('203.0.113.0/24'),   // TEST-NET-3 documentation
  parseCidrV4('224.0.0.0/4'),      // Multicast
  parseCidrV4('240.0.0.0/4'),      // Reserved
  parseCidrV4('255.255.255.255/32')// Broadcast
];

function isPrivateIPv4(ip: string): boolean {
  try {
    const num = ipv4ToBigInt(ip);
    for (const range of PRIVATE_V4_RANGES) {
      if (num >= range.start && num <= range.end) {
        return true;
      }
    }
  } catch {
    return true; // Malformed IPv4 is treated as unsafe
  }
  return false;
}

function isPrivateIPv6(ip: string): boolean {
  const normalized = ip.toLowerCase();
  // Loopback
  if (normalized === '::1' || normalized === '0:0:0:0:0:0:0:1') return true;
  // Unspecified
  if (normalized === '::' || normalized === '0:0:0:0:0:0:0:0') return true;
  // Unique local addresses (fc00::/7)
  if (normalized.startsWith('fc') || normalized.startsWith('fd')) return true;
  // Link-local unicast (fe80::/10)
  if (normalized.startsWith('fe80:') || normalized.startsWith('fe9') || normalized.startsWith('fea') || normalized.startsWith('feb')) return true;
  // IPv4-mapped IPv6 (::ffff:127.0.0.1)
  if (normalized.startsWith('::ffff:')) {
    const v4Part = normalized.replace('::ffff:', '');
    if (net.isIPv4(v4Part)) {
      return isPrivateIPv4(v4Part);
    }
  }
  return false;
}

export function isPrivateIp(ip: string): boolean {
  if (net.isIPv4(ip)) {
    return isPrivateIPv4(ip);
  }
  if (net.isIPv6(ip)) {
    return isPrivateIPv6(ip);
  }
  return true; // Unknown IP format is unsafe
}

/**
 * Validates a target URL against SSRF and security requirements.
 */
export async function validateUrlSafety(inputUrl: string): Promise<{ safe: boolean; error?: string }> {
  let parsed: URL;
  try {
    parsed = new URL(inputUrl);
  } catch {
    return { safe: false, error: 'Malformed or invalid URL syntax' };
  }

  // Only allow HTTP and HTTPS protocols
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    return { safe: false, error: 'Only http and https protocols are permitted' };
  }

  const hostname = parsed.hostname.toLowerCase();

  // Check localhost variants
  if (
    hostname === 'localhost' ||
    hostname.endsWith('.localhost') ||
    hostname === '0.0.0.0' ||
    hostname === '127.0.0.1' ||
    hostname === '[::1]'
  ) {
    return { safe: false, error: 'Target URL cannot point to localhost or loopback address' };
  }

  // Check self-referencing links
  try {
    const ownUrl = new URL(config.baseUrl);
    if (parsed.hostname.toLowerCase() === ownUrl.hostname.toLowerCase() && parsed.port === ownUrl.port) {
      return { safe: false, error: 'Cannot shorten links pointing back to this URL shortener domain' };
    }
  } catch {
    // If baseUrl cannot be parsed, ignore self-check
  }

  // If hostname is directly an IP literal
  if (net.isIP(hostname)) {
    if (isPrivateIp(hostname)) {
      return { safe: false, error: 'Target URL resolves to a private or restricted IP address' };
    }
  } else {
    // Perform DNS lookup to inspect resolved IPs (prevents DNS rebinding and private LAN hostnames)
    try {
      const addresses = await dns.lookup(hostname, { all: true });
      if (!addresses || addresses.length === 0) {
        return { safe: false, error: 'Unable to resolve domain name' };
      }

      for (const record of addresses) {
        if (isPrivateIp(record.address)) {
          return {
            safe: false,
            error: `Target domain resolves to a restricted/private IP address (${record.address})`,
          };
        }
      }
    } catch (dnsErr: any) {
      // In local dev/testing with offline domains or mock hosts, give clear feedback
      return { safe: false, error: `Domain DNS lookup failed: ${dnsErr?.message || 'Host not found'}` };
    }
  }

  return { safe: true };
}
