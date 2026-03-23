# Multi-stage: smaller image, no devDependencies, slimmer OS base (fewer packages for Docker Scout).
# Final stage runs as non-root.

FROM node:22-bookworm-slim AS builder
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM node:22-bookworm-slim AS production
WORKDIR /app

ENV NODE_ENV=production

LABEL org.opencontainers.image.title="jira-zephyr-mcp" \
  org.opencontainers.image.description="MCP server for Jira and Zephyr Scale" \
  org.opencontainers.image.source="https://github.com/miklosbagi/jira-zephyr-mcp"

# Apply Debian security updates at build time (reduces reported OS CVEs vs stale layer cache).
RUN apt-get update \
  && apt-get upgrade -y \
  && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

COPY --from=builder /app/dist ./dist

RUN chown -R node:node /app
USER node

CMD ["node", "dist/index.js"]
