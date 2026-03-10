FROM node:20-slim AS base
WORKDIR /app
RUN corepack enable

# Install deps
FROM base AS deps
COPY package.json package-lock.json* turbo.json ./
COPY apps/web/package.json apps/web/
COPY packages/shared/package.json packages/shared/
RUN npm install --production=false

# Build shared + web
FROM deps AS builder
COPY packages/shared packages/shared
COPY apps/web apps/web
RUN npx turbo run build --filter=@saifcontrol/web

# Production image
FROM node:20-slim AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

RUN addgroup --system saifcontrol && adduser --system --ingroup saifcontrol saifcontrol

COPY --from=builder /app/apps/web/.next/standalone ./
COPY --from=builder /app/apps/web/.next/static apps/web/.next/static
COPY --from=builder /app/apps/web/public apps/web/public

USER saifcontrol
EXPOSE 3000

CMD ["node", "apps/web/server.js"]
