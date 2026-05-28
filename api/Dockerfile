# Debian (glibc) — better-sqlite3 ships prebuilt binaries for this target,
# avoiding the python/node-gyp compile that fails on Alpine/musl.
FROM node:20-bookworm-slim AS build
WORKDIR /app

# Build toolchain (safety net if a native module lacks a prebuilt). Not in runtime.
RUN apt-get update && apt-get install -y --no-install-recommends \
      python3 make g++ ca-certificates \
    && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json* ./
RUN npm install --include=dev

COPY . .
RUN npm run build
RUN npm prune --omit=dev

# ─────────────────────────────────────────────────────────────────────
# Runtime image — slim, no build toolchain
# ─────────────────────────────────────────────────────────────────────
FROM node:20-bookworm-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3001

# Persist SQLite batch store across deploys (mount a Railway volume at /data)
ENV BATCH_DB_PATH=/data/batches.db
RUN mkdir -p /data

COPY --from=build /app/dist        ./dist
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/package.json ./package.json

EXPOSE 3001
CMD ["node", "dist/server.js"]
