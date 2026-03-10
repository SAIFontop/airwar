FROM node:22-alpine AS base
RUN apk add --no-cache libc6-compat openssl
WORKDIR /app

# Install dependencies
FROM base AS deps
COPY package.json package-lock.json* turbo.json ./
COPY packages/types/package.json ./packages/types/
COPY apps/api/package.json ./apps/api/
RUN npm ci --ignore-scripts

# Build
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/packages/types/node_modules ./packages/types/node_modules
COPY --from=deps /app/apps/api/node_modules ./apps/api/node_modules
COPY . .
RUN npx prisma generate --schema=apps/api/prisma/schema.prisma
RUN npx turbo build --filter=@saifcontrol/api

# Production
FROM base AS runner
ENV NODE_ENV=production
RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 saifcontrol
COPY --from=builder --chown=saifcontrol:nodejs /app/apps/api/dist ./apps/api/dist
COPY --from=builder --chown=saifcontrol:nodejs /app/apps/api/prisma ./apps/api/prisma
COPY --from=builder --chown=saifcontrol:nodejs /app/apps/api/node_modules ./apps/api/node_modules
COPY --from=builder --chown=saifcontrol:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=saifcontrol:nodejs /app/packages/types ./packages/types
USER saifcontrol
EXPOSE 3001
CMD ["node", "apps/api/dist/main.js"]
