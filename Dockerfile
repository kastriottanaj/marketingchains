# syntax=docker/dockerfile:1

# ── build ──────────────────────────────────────────────────────────────────
FROM node:24-slim AS build
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

# SITE_URL (https://your-domain) is baked in at build time: it drives canonical
# links and tells the server which domain's proxy headers to trust (see
# astro.config.mjs). compose.yaml passes it in from SITE_DOMAIN.
ARG SITE_URL
ENV SITE_URL=$SITE_URL \
    ASTRO_TELEMETRY_DISABLED=1
RUN npm run build && npm prune --omit=dev

# ── run ────────────────────────────────────────────────────────────────────
FROM node:24-slim
ENV NODE_ENV=production \
    HOST=0.0.0.0 \
    PORT=4321
WORKDIR /app

COPY --from=build --chown=node:node /app/package.json ./
COPY --from=build --chown=node:node /app/node_modules ./node_modules
COPY --from=build --chown=node:node /app/dist ./dist

USER node
EXPOSE 4321
CMD ["node", "./dist/server/entry.mjs"]
