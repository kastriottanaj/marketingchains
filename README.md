# Marketing Chains LLC: corporate website

Corporate site for Marketing Chains LLC, built with Astro and served by a small Node.js backend. It shows underwriters, payment gateways, and compliance teams what the company does, that it owns and operates Visifluent, and how it earns revenue.

## Stack

- **Astro 7** renders the pages: plain HTML and CSS, no client-side JavaScript, fonts self-hosted.
- **Node.js** is the backend, through Astro's official `@astrojs/node` adapter in standalone mode. One process, one language, one dependency tree. It server-renders every route, adds security headers (including a strict Content-Security-Policy) in [src/middleware.ts](src/middleware.ts), serves a custom 404, and exposes `GET /api/health` for uptime checks.

Django was the other option. For this site it would add a second runtime and a second set of dependencies without using anything Django is for (ORM, admin, auth), so Node is the better fit.

## Commands

| Command | What it does |
| :-- | :-- |
| `npm install` | Install dependencies |
| `npm run dev` | Dev server at http://localhost:4321 |
| `npm run build` | Production build into `dist/` |
| `npm start` | Run the built server (`node ./dist/server/entry.mjs`) |
| `npm run check` | Type-check the project |

Requires Node.js 22.23.4 or newer.

## Deploying

```sh
npm ci
SITE_URL=https://your-domain.example npm run build
HOST=0.0.0.0 PORT=8080 npm start
```

- `SITE_URL` (build time, optional) switches on canonical and Open Graph URLs.
- `HOST` and `PORT` (run time) choose where the server listens. The default is `localhost` only, so containers and hosting platforms need `HOST=0.0.0.0`.
- Put the server behind a reverse proxy or CDN that terminates TLS (and compresses responses). Point your uptime monitor at `/api/health`.

### Vercel (review copies)

The same code deploys to Vercel: when Vercel builds it (`VERCEL=1`), [astro.config.mjs](astro.config.mjs) switches to `@astrojs/vercel` and the site runs as serverless functions with the same middleware and headers. Deploy with `npx vercel deploy --prod`; the project's main `*.vercel.app` address is public, while the long per-deployment URLs require a Vercel login. Vercel's free Hobby plan is for non-commercial use only, so use it for review copies, not as the live company site.

### Hetzner (production): Docker + Caddy

The site runs as two containers: the Node server, and [Caddy](https://caddyserver.com), which gets and renews the HTTPS certificate automatically and compresses responses. Files: [Dockerfile](Dockerfile), [compose.yaml](compose.yaml), [deploy/Caddyfile](deploy/Caddyfile), [.env.example](.env.example). The site is stateless (no database), so there is nothing to back up except your `.env`.

1. **Domain.** Register one, then (after step 2) point its `A` record (and `AAAA` for IPv6) at the server's IP address.
2. **Create the server** in the Hetzner Cloud Console: Ubuntu 24.04, the smallest shared-vCPU type with at least 2 GB RAM, and add your SSH key. If you use a Cloud Firewall, allow TCP 22 (ideally only from your IP), TCP 80, TCP 443, and UDP 443.
3. **Install Docker** on it: `ssh root@SERVER_IP`, then `curl -fsSL https://get.docker.com | sh`.
4. **Copy the project** from your Mac (the `.env` is never copied):
   ```sh
   rsync -az --delete --exclude node_modules --exclude dist --exclude .astro --exclude .vercel --exclude .git --exclude .env ./ root@SERVER_IP:/opt/marketingchains/
   ```
5. **Configure and start** on the server:
   ```sh
   cd /opt/marketingchains
   cp .env.example .env && nano .env     # set SITE_DOMAIN, RESEND_API_KEY, CONTACT_FROM
   docker compose up -d --build
   docker compose ps                     # both services should be running; "app" healthy
   ```
   The first visit can take a few seconds while the certificate is issued. That needs the DNS record from step 1 to be live and ports 80 and 443 open.
6. **Update later:** repeat the `rsync`, then `docker compose up -d --build`. Logs: `docker compose logs -f app`.

`SITE_DOMAIN` becomes `SITE_URL` at build time, which does three things: canonical links, and telling the server to trust Caddy's HTTPS and visitor-IP headers for that domain only. Without it, real contact-form submissions over HTTPS would be rejected and the consent record would store the proxy's IP. Test with `curl -I https://your-domain` and by sending yourself a message through the form.

### Contact form (email delivery)

The contact form on the home page posts back to the site and emails each submission to the company mailbox through [Resend](https://resend.com). The email also serves as the consent record: it carries the timestamp, the exact consent wording shown, the IP address, and the browser. Until the variables below are set, the form shows a polite "could not send" message instead of pretending to succeed.

| Variable | Required | Meaning |
| :-- | :-- | :-- |
| `RESEND_API_KEY` | yes | Resend API key with sending access |
| `CONTACT_FROM` | yes | A sender on a domain verified in Resend, e.g. `Marketing Chains LLC <contact@visifluent.com>` |
| `CONTACT_TO` | no | Where submissions go. Defaults to the contact email in `company.ts` |

On Vercel, add them with `npx vercel env add RESEND_API_KEY production` (it prompts for the value) or in the project settings, then redeploy. For a Node server, set them in the environment before `npm start`. The SMS consent box is optional on purpose: carriers expect that SMS consent is not a condition of contacting you. To make it required, add `required` to the checkbox in `ContactSection.astro`.

## Where things live

| Path | Purpose |
| :-- | :-- |
| [src/config/company.ts](src/config/company.ts) | Legal name, jurisdiction, registered address, copyright year, optional contact email |
| [src/pages/index.astro](src/pages/index.astro) | The landing page: markup and its styles together |
| [src/pages/terms.astro](src/pages/terms.astro), [src/pages/privacy.astro](src/pages/privacy.astro), [src/pages/refund.astro](src/pages/refund.astro) | Legal pages linked from the footer (`/refunds` redirects to `/refund`) |
| [src/lib/contact.ts](src/lib/contact.ts), [src/components/ContactSection.astro](src/components/ContactSection.astro) | The contact form: validation, spam trap, consent wording, and email delivery |
| [src/styles/global.css](src/styles/global.css) | Colour tokens, typography, shared components, print styles |
| [src/middleware.ts](src/middleware.ts) | Security headers and CSP |

## Before going live

1. **Have a lawyer review `/terms`, `/privacy`, and `/refund`.** They are drafts, not legal advice. They mirror the Terms and Privacy Policy published at visifluent.com (refund window, renewal, notice periods, liability cap, data handling), so **update both places together** when either changes (sections 8 to 11 of `/terms` and `/refund` repeat the same cancellation and refund terms), and bump `legalPagesUpdated` in `company.ts`. The terms for SEO and website services and for courses are defaults chosen for this site.
2. **Set the contact-form variables** above, send a real test message, and confirm it reaches the mailbox.
3. **Check the contact email** in `company.ts` (`info@visifluent.com`, the address published on visifluent.com/contact).
4. **Set `SITE_URL`** when building for production (Docker does this from `SITE_DOMAIN`).
5. **If you add analytics or any script**, update the privacy policy (it states that the site sets no cookies and uses no trackers) and loosen the CSP in `src/middleware.ts` to match. If you actually send text messages, register the campaign with your SMS provider and keep the consent wording in `src/lib/contact.ts` identical to what you registered.
