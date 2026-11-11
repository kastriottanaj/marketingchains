import type { APIRoute } from 'astro';

/** Liveness probe for uptime monitors and load balancers. */
export const GET: APIRoute = () =>
  Response.json({ status: 'ok' }, { headers: { 'Cache-Control': 'no-store' } });
