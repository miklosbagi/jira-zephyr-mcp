# Multi-stage: full toolchain only in builder. Runtime uses Google's distroless Node image
# (no npm, no shell, minimal OS) so scanners do not flag the bundled npm dependency tree
# (tar, minimatch, glob, etc.) that ships with official node images but is unused at runtime.
#
# Final stage runs as nonroot (distroless :nonroot).
# Ref: https://github.com/GoogleContainerTools/distroless/blob/main/nodejs/README.md

FROM node:22-bookworm-slim AS builder
WORKDIR /app

# Debian security updates in build stage only (keeps builder current; not shipped in final image).
RUN apt-get update \
  && apt-get upgrade -y \
  && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build \
  && npm prune --omit=dev

FROM gcr.io/distroless/nodejs22-debian13:nonroot
WORKDIR /app

ENV NODE_ENV=production

LABEL org.opencontainers.image.title="jira-zephyr-mcp" \
  org.opencontainers.image.description="MCP server for Jira and Zephyr Scale" \
  org.opencontainers.image.source="https://github.com/miklosbagi/jira-zephyr-mcp"

COPY --from=builder --chown=nonroot:nonroot /app/node_modules ./node_modules
COPY --from=builder --chown=nonroot:nonroot /app/dist ./dist

CMD ["dist/index.js"]
