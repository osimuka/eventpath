# Service Analytics - EventPath

A comprehensive, multi-service event analytics platform with real-time ingestion, workflow management, AI-powered insights, and funnel analysis.

## Architecture

- **API Service** (Node.js/TypeScript): Event ingestion, workflow CRUD, analytics queries
- **AI Agent** (Python): LLM-powered funnel explanations and anomaly detection
- **Web UI** (React/Next.js): Dashboard for analytics visualization and insights
- **Worker** (Node.js): Background job processing
- **SDKs**: JavaScript and Python clients for event tracking
- **Database**: PostgreSQL with migrations
- **Infrastructure**: Kubernetes manifests and Docker Compose for local development

## Quick Start

### Prerequisites

- Node.js 18+
- Python 3.10+
- Docker & Docker Compose
- pnpm (or npm/yarn)

### Local Development

```bash
# Install dependencies
pnpm install

# Start services with Docker Compose
docker-compose up -d

# Run migrations
pnpm run db:migrate

# Start services in development mode
pnpm run dev
```

## Project Structure

```
service-analytics/
├─ services/
│  ├─ api/              # Node.js API service
│  ├─ ai-agent/         # Python AI microservice
│  ├─ web/              # React web dashboard
│  └─ worker/           # Background jobs
├─ packages/
│  ├─ sdk-js/           # JavaScript SDK
│  ├─ sdk-python/       # Python SDK
│  └─ shared-types/     # Shared TypeScript types
└─ infra/
   ├─ k8s/              # Kubernetes manifests
   └─ db/               # Database schema and migrations
```

## Available Scripts

- `pnpm install` - Install all dependencies
- `pnpm run dev` - Start all services in development mode
- `pnpm run build` - Build all packages
- `pnpm run test` - Run all tests
- `pnpm run db:migrate` - Run database migrations
- `pnpm run docker:build` - Build Docker images

## Services Documentation

### API Service

See `services/api/README.md` for detailed API documentation.

### AI Agent

See `services/ai-agent/README.md` for AI model documentation.

### Web UI

See `services/web/README.md` for frontend setup.

## License

MIT License - Copyright (c) 2025 4onstudios (https://4onstudios.com)
