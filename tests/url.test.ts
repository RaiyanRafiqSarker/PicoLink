import { encodeBase62, decodeBase62 } from '../src/utils/base62.js';
import { isReservedSlug, isValidSlugFormat } from '../src/utils/blacklist.js';
import { isPrivateIp, validateUrlSafety } from '../src/utils/ssrf.js';

let passed = 0;
let failed = 0;

function assert(condition: boolean, msg: string) {
  if (!condition) {
    console.error(`❌ FAIL: ${msg}`);
    failed++;
  } else {
    console.log(`✅ PASS: ${msg}`);
    passed++;
  }
}

async function runTests() {
  console.log('\n=== [1] Base62 Encoding & Decoding Tests ===');

  // Offset 100,000,000 test
  const code100M = encodeBase62(100000000);
  assert(code100M.length === 5, `100,000,000 encodes to 5-char code: "${code100M}"`);
  assert(decodeBase62(code100M) === 100000000n, `Decode restores 100,000,000`);

  // Multiple IDs reversibility test
  const testIds = [0, 1, 61, 62, 1000000, 100000000, 999999999, 1234567890123n];
  for (const id of testIds) {
    const encoded = encodeBase62(id);
    const decoded = decodeBase62(encoded);
    assert(decoded === BigInt(id), `Reversible Base62 for ${id} -> "${encoded}" -> ${decoded}`);
  }

  console.log('\n=== [2] Reserved Slugs & Blacklist Tests ===');
  const reservedList = ['api', 'admin', 'health', 'dashboard', 'login', 'robots.txt'];
  for (const slug of reservedList) {
    assert(isReservedSlug(slug), `"${slug}" is correctly blocked as reserved slug`);
    assert(isReservedSlug(slug.toUpperCase()), `Case-insensitive check for "${slug.toUpperCase()}" blocks it`);
  }
  assert(!isReservedSlug('my-cool-link'), '"my-cool-link" is NOT reserved');
  assert(!isReservedSlug('summer2026'), '"summer2026" is NOT reserved');

  console.log('\n=== [3] Slug Format Validation Tests ===');
  assert(isValidSlugFormat('valid-slug_123'), 'valid-slug_123 is valid format');
  assert(isValidSlugFormat('abc'), '3 chars "abc" is valid');
  assert(!isValidSlugFormat('ab'), '2 chars "ab" is rejected (too short)');
  assert(!isValidSlugFormat('invalid slug!'), '"invalid slug!" with spaces/exclamation is rejected');
  assert(!isValidSlugFormat('slug$name'), '"slug$name" with special chars is rejected');

  console.log('\n=== [4] SSRF IP Range Tests ===');
  assert(isPrivateIp('127.0.0.1'), '127.0.0.1 is detected as private/loopback');
  assert(isPrivateIp('127.100.50.1'), '127.100.50.1 loopback subnet detected');
  assert(isPrivateIp('10.0.0.1'), '10.0.0.1 (10.0.0.0/8) detected as private');
  assert(isPrivateIp('10.255.255.255'), '10.255.255.255 detected as private');
  assert(isPrivateIp('172.16.0.1'), '172.16.0.1 (172.16.0.0/12) detected as private');
  assert(isPrivateIp('172.31.255.254'), '172.31.255.254 detected as private');
  assert(isPrivateIp('192.168.1.1'), '192.168.1.1 (192.168.0.0/16) detected as private');
  assert(isPrivateIp('169.254.169.254'), '169.254.169.254 (Cloud metadata) detected as private');
  assert(isPrivateIp('0.0.0.0'), '0.0.0.0 detected as private');
  assert(isPrivateIp('::1'), 'IPv6 ::1 loopback detected');
  assert(!isPrivateIp('8.8.8.8'), '8.8.8.8 is NOT private');
  assert(!isPrivateIp('1.1.1.1'), '1.1.1.1 is NOT private');

  console.log('\n=== [5] URL SSRF Safety Validation Tests ===');
  const ssrfLocalhost = await validateUrlSafety('http://localhost:3000/secret');
  assert(!ssrfLocalhost.safe, `http://localhost:3000 rejected: ${ssrfLocalhost.error}`);

  const ssrf127 = await validateUrlSafety('http://127.0.0.1/admin');
  assert(!ssrf127.safe, `http://127.0.0.1 rejected: ${ssrf127.error}`);

  const ssrfMeta = await validateUrlSafety('http://169.254.169.254/latest/meta-data/');
  assert(!ssrfMeta.safe, `AWS metadata 169.254.169.254 rejected: ${ssrfMeta.error}`);

  const ssrfProto = await validateUrlSafety('file:///etc/passwd');
  assert(!ssrfProto.safe, `file:// protocol rejected: ${ssrfProto.error}`);

  const ssrfFtp = await validateUrlSafety('ftp://files.example.com');
  assert(!ssrfFtp.safe, `ftp:// protocol rejected: ${ssrfFtp.error}`);

  const validPublic = await validateUrlSafety('https://github.com/microsoft/TypeScript');
  assert(validPublic.safe, 'https://github.com/microsoft/TypeScript is safe');

  console.log(`\n========================================`);
  console.log(`Test Results: ${passed} PASSED, ${failed} FAILED`);
  console.log(`========================================\n`);

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
