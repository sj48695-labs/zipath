FROM node:20-alpine AS base
WORKDIR /app

# Install dependencies
FROM base AS deps
COPY package.json package-lock.json* turbo.json ./
COPY apps/api/package.json ./apps/api/
COPY packages/db/package.json ./packages/db/
COPY packages/types/package.json ./packages/types/
COPY packages/config/package.json ./packages/config/
RUN npm install --production=false

# Build
FROM base AS builder
COPY --from=deps /app ./
COPY . .
RUN npx turbo run build --filter=@zipath/api

# Production — prune to only what @zipath/api needs
FROM base AS runner
ENV NODE_ENV=production

# Copy entire built monorepo structure (node_modules + dist)
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./

# Copy API build output and its node_modules
COPY --from=builder /app/apps/api/dist ./apps/api/dist
COPY --from=builder /app/apps/api/package.json ./apps/api/
COPY --from=builder /app/apps/api/node_modules ./apps/api/node_modules

# Copy @zipath/db build output and its node_modules
COPY --from=builder /app/packages/db/dist ./packages/db/dist
COPY --from=builder /app/packages/db/package.json ./packages/db/
COPY --from=builder /app/packages/db/node_modules ./packages/db/node_modules

WORKDIR /app/apps/api
EXPOSE ${PORT:-4000}
CMD ["node", "dist/main"]
