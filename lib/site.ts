const configuredUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim();

/** Local previews are deliberately non-indexable until a real origin is configured. */
function resolveSiteUrl(value: string | undefined): string {
  if (!value) return "http://localhost:3000";
  const url = new URL(value);
  if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password || url.search || url.hash || url.pathname !== '/') {
    throw new Error('NEXT_PUBLIC_SITE_URL must be an HTTP(S) origin without credentials, a path, query or fragment.');
  }
  if (url.hostname === 'example.com' || url.hostname.endsWith('.example.com')) {
    throw new Error('Replace the example domain in NEXT_PUBLIC_SITE_URL with the actual deployment origin.');
  }
  return url.origin;
}

export const SITE_URL = resolveSiteUrl(configuredUrl);
export const SITE_INDEXABLE = Boolean(configuredUrl) && new URL(SITE_URL).protocol === 'https:' &&
  !['localhost', '127.0.0.1', '[::1]'].includes(new URL(SITE_URL).hostname) &&
  process.env.YIFANG_NOINDEX !== '1';

/** Static hosting uses directory URLs. Use the same form in development and production. */
export function sitePath(path: string): string {
  return path === '/' ? '/' : `/${path.replace(/^\/+|\/+$/g, '')}/`;
}

export function absoluteUrl(path: string): string {
  return `${SITE_URL}${sitePath(path)}`;
}
