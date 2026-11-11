// @ts-check
import { defineConfig } from 'astro/config';
import node from '@astrojs/node';
import vercel from '@astrojs/vercel';

// Public origin of the deployed site, e.g. SITE_URL=https://example.com
// Read at build time. When set, pages emit canonical and Open Graph URLs.
const site = process.env.SITE_URL || undefined;

// Behind a TLS-terminating reverse proxy (Caddy on the Hetzner server) Astro only
// trusts the proxy's X-Forwarded-Host/Proto/For headers for domains listed here.
// Without this, the contact form's cross-site check sees "http://" and rejects
// real HTTPS submissions, and the consent record would store the proxy's IP
// instead of the visitor's. Derived from SITE_URL, so there is one setting.
const allowedDomains = site
  ? [
      (({ protocol, hostname, port }) => ({
        protocol: protocol.slice(0, -1),
        hostname,
        ...(port ? { port } : {}),
      }))(new URL(site)),
    ]
  : [];

// Vercel sets VERCEL=1 during its builds and runs the site as serverless
// functions. Everywhere else (local, VPS, Docker) it is a standalone Node server.
// The only request body this site accepts is the small contact form, so cap it.
const adapter = process.env.VERCEL ? vercel() : node({ mode: 'standalone', bodySizeLimit: 64 * 1024 });

// https://astro.build/config
export default defineConfig({
  site,

  // Every route is rendered on demand, so the security headers in
  // src/middleware.ts are attached to each HTML response on either host.
  output: 'server',
  adapter,

  security: { allowedDomains },

  // The refund page used to live at /refunds; keep old links working.
  redirects: { '/refunds': '/refund' },

  // The site has no logins or server-side state, so sessions (and the cookie
  // and filesystem storage the Node adapter would otherwise wire up) are off.
  session: false,

  // Plain HTML whitespace rules. (Astro 7 defaults to JSX-style whitespace,
  // which silently drops the space between adjacent inline elements.)
  compressHTML: true,

  build: {
    // Always emit CSS as external files, so the CSP can forbid inline styles.
    inlineStylesheets: 'never',
  },
});
