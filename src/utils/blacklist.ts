export const RESERVED_SLUGS: ReadonlySet<string> = new Set([
  'api',
  'admin',
  'health',
  'healthz',
  'dashboard',
  'login',
  'logout',
  'register',
  'robots.txt',
  'favicon.ico',
  'sitemap.xml',
  'static',
  'assets',
  'stats',
  'metrics',
  'docs',
  'swagger',
  'redoc',
  'help',
  'null',
  'undefined',
  'void',
]);

/**
 * Checks whether a custom slug is a reserved system path or invalid.
 */
export function isReservedSlug(slug: string): boolean {
  return RESERVED_SLUGS.has(slug.toLowerCase());
}

/**
 * Validates custom slug syntax: 3-64 characters, alphanumeric, hyphens, and underscores.
 */
export function isValidSlugFormat(slug: string): boolean {
  const SLUG_REGEX = /^[a-zA-Z0-9_-]{3,64}$/;
  return SLUG_REGEX.test(slug);
}
