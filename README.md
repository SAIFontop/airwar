# Saif Control

**Next-generation FiveM server management platform.** Enterprise-grade infrastructure, deep server introspection, automation, and a refined modern UI.

---

## Architecture

```
saifcontrol/
├── apps/
│   ├── api/          # NestJS backend (GraphQL + WebSocket + REST)
│   └── web/          # Next.js 15 frontend (App Router)
├── packages/
│   └── types/        # Shared TypeScript types & enums
├── services/
│   └── agent/        # Lightweight agent that runs on FiveM server machines
├── docker-compose.yml
├── turbo.json
└── package.json
```

### Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | Next.js 15, React 19, TailwindCSS, Zustand, TanStack Query |
| **Backend** | NestJS 10, Fastify, Apollo GraphQL, Prisma, Redis |
| **Database** | PostgreSQL 16 |
| **Cache/PubSub** | Redis 7 |
| **Agent** | Node.js, WebSocket (ws) |
| **Deployment** | Docker Compose |

---

## Features

- **Dashboard** — Real-time overview with gauges, server status, alerts
- **Server Management** — Start/stop/restart, multi-server support, live console
- **Player Monitor** — Search, kick, ban, view identifiers, action history
- **Resource Profiler** — Per-resource CPU/memory, dependency graph, sort/filter
- **Metrics** — CPU, memory, tick rate, players, network — with sparkline charts
- **Log Browser** — 50K buffer, level filtering, search, export, error clustering
- **Automation** — Event-driven rules (high CPU → restart, crash → recovery, schedules)
- **Alerts** — Threshold-based alerts with acknowledge/resolve workflow
- **File Manager** — Browse, edit, create files on the server filesystem
- **Command Palette** — Cmd+K quick navigation across the panel

---

## Getting Started

### Prerequisites

- **Node.js** 22+
- **PostgreSQL** 16+
- **Redis** 7+
- **npm** 10+

### Development Setup

```bash
# 1. Clone and install
git clone <your-repo-url> saifcontrol
cd saifcontrol
npm install

# 2. Set up environment
cp apps/api/.env.example apps/api/.env
# Edit apps/api/.env with your database URL, Redis URL, JWT secret

# 3. Initialize database
cd apps/api
npx prisma migrate dev --name init
npx prisma generate
cd ../..

# 4. Start development servers
npm run dev
```

This starts:
- **API** at `http://localhost:3001`
- **Web** at `http://localhost:3000`

### Docker Deployment

```bash
# Build and start all services
docker compose up -d

# Run database migrations
docker compose exec api npx prisma migrate deploy --schema=apps/api/prisma/schema.prisma
```

Services started:
- **PostgreSQL** on port 5432
- **Redis** on port 6379
- **API** on port 3001
- **Web** on port 3000

### Server Agent

The agent runs on each FiveM server machine and reports metrics back to the API.

```bash
cd services/agent
cp .env.example .env
# Edit .env — set API_URL, AGENT_TOKEN, SERVER_ID, FX_SERVER_PATH
npm install
npm run dev
```

---

## Project Scripts

| Command | Description |
|---------|------------|
| `npm run dev` | Start all apps in development mode |
| `npm run build` | Build all apps for production |
| `npm run lint` | Lint all packages |
| `npm run docker:up` | Start Docker Compose stack |
| `npm run docker:down` | Stop Docker Compose stack |

---

## Environment Variables

### API (`apps/api/.env`)

| Variable | Default | Description |
|----------|---------|-------------|
| `DATABASE_URL` | — | PostgreSQL connection string |
| `REDIS_URL` | `redis://localhost:6379` | Redis connection string |
| `JWT_SECRET` | — | Secret for signing JWT tokens |
| `API_PORT` | `3001` | API server port |
| `CORS_ORIGIN` | `http://localhost:3000` | Allowed CORS origin |

### Agent (`services/agent/.env`)

| Variable | Default | Description |
|----------|---------|-------------|
| `API_URL` | `ws://localhost:3001/ws` | WebSocket endpoint for the API |
| `AGENT_TOKEN` | — | Authentication token |
| `SERVER_ID` | `server-1` | Unique server identifier |
| `COLLECT_INTERVAL_MS` | `5000` | Metrics collection interval |
| `FX_SERVER_PATH` | — | Path to FXServer data directory |

---

## License

MIT
