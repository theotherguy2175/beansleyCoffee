# syntax=docker/dockerfile:1

FROM node:22-bookworm-slim AS base-deps
RUN apt-get update && apt-get install -y --no-install-recommends python3 make g++ \
  && rm -rf /var/lib/apt/lists/*

  
FROM base-deps AS client-build
WORKDIR /app
COPY package.json package-lock.json ./
COPY client/package.json client/package.json
COPY server/package.json server/package.json
RUN npm ci
COPY client client
RUN npm run build -w client

FROM base-deps AS server-build
WORKDIR /app
COPY package.json package-lock.json ./
COPY client/package.json client/package.json
COPY server/package.json server/package.json
RUN npm ci
COPY server server
RUN npm run build -w server

FROM base-deps AS runtime
WORKDIR /app
ENV NODE_ENV=production
COPY server/package.json ./package.json
RUN npm install --omit=dev
COPY --from=server-build /app/server/dist ./dist
COPY --from=server-build /app/server/src/db/migrations ./dist/db/migrations
COPY --from=server-build /app/server/seed ./seed
COPY --from=client-build /app/client/dist ./public

# node:22-bookworm-slim ships a pre-created non-root "node" user (uid/gid 1000)
# — run as that instead of root. /data is a mounted volume (bind mount or
# PVC), not baked into the image, so its permissions are handled separately:
# see docker-compose.yml's user override and k8s/deployment.yaml's fsGroup.
RUN chown -R node:node /app
USER node

EXPOSE 3000
CMD ["node", "dist/index.js"]
