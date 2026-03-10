FROM node:22-alpine AS base
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Install dependencies
FROM base AS deps
COPY package.json package-lock.json* turbo.json ./
COPY packages/types/package.json ./packages/types/
COPY apps/web/package.json ./apps/web/
RUN npm ci --ignore-scripts

# Build
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/packages/types/node_modules ./packages/types/node_modules
COPY --from=deps /app/apps/web/node_modules ./apps/web/node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN npx turbo build --filter=@saifcontrol/web

# Production
FROM base AS runner
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 saifcontrol
COPY --from=builder /app/apps/web/public ./apps/web/public
COPY --from=builder --chown=saifcontrol:nodejs /app/apps/web/.next/standalone ./
COPY --from=builder --chown=saifcontrol:nodejs /app/apps/web/.next/static ./apps/web/.next/static
USER saifcontrol
EXPOSE 3000
ENV HOSTNAME="0.0.0.0"
CMD ["node", "apps/web/server.js"]
