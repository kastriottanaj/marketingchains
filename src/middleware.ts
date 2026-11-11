import { defineMiddleware } from 'astro:middleware';

/**
 * Security headers for every response served by the Node backend.
 *
 * The site ships no JavaScript and no inline CSS (see `build.inlineStylesheets`
 * in astro.config.mjs) and loads nothing from third parties, so the policy can
 * be strict: only same-origin styles and fonts, same-origin or data: images.
 * The contact form posts back to this site, hence `form-action 'self'`.
 */
const contentSecurityPolicy = [
  "default-src 'none'",
  "style-src 'self'",
  "font-src 'self'",
  "img-src 'self' data:",
  "base-uri 'none'",
  "form-action 'self'",
  "frame-ancestors 'none'",
].join('; ');

const securityHeaders: Record<string, string> = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy':
    'accelerometer=(), camera=(), geolocation=(), gyroscope=(), magnetometer=(), microphone=(), payment=(), usb=()',
  'Cross-Origin-Opener-Policy': 'same-origin',
  // Ignored by browsers over plain HTTP, so it is harmless for local runs.
  'Strict-Transport-Security': 'max-age=31536000',
};

export const onRequest = defineMiddleware(async (_context, next) => {
  const response = await next();

  for (const [name, value] of Object.entries(securityHeaders)) {
    response.headers.set(name, value);
  }

  // Declare the charset in the header too, not just in the <meta> tag.
  if (response.headers.get('Content-Type') === 'text/html') {
    response.headers.set('Content-Type', 'text/html; charset=utf-8');
  }

  // The dev server injects inline scripts for hot reload, which a strict CSP
  // would block, so the policy is only applied to production builds.
  if (import.meta.env.PROD) {
    response.headers.set('Content-Security-Policy', contentSecurityPolicy);
  }

  return response;
});
