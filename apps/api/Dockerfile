FROM node:20-slim AS base
WORKDIR /app
RUN corepack enable

# Install deps
FROM base AS deps
COPY package.json package-lock.json* turbo.json ./
COPY apps/api/package.json apps/api/
COPY packages/shared/package.json packages/shared/
RUN npm install --production=false

# Build shared + api
FROM deps AS builder
COPY packages/shared packages/shared
COPY apps/api apps/api
RUN npx turbo run build --filter=@saifcontrol/api

# Production image
FROM node:20-slim AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV SAIFCONTROL_DATA_DIR=/data
ENV SAIFCONTROL_API_PORT=4800

RUN addgroup --system saifcontrol && adduser --system --ingroup saifcontrol saifcontrol
RUN mkdir -p /data && chown saifcontrol:saifcontrol /data

COPY --from=builder /app/node_modules node_modules
COPY --from=builder /app/packages/shared packages/shared
COPY --from=builder /app/apps/api apps/api

USER saifcontrol
EXPOSE 4800

CMD ["node", "apps/api/dist/index.js"]
