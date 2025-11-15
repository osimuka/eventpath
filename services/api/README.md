# API Service

Event ingestion and analytics query API built with Node.js/TypeScript and Express.

## Features

- ✅ Event ingestion endpoints
- ✅ Workflow CRUD operations
- ✅ Funnel analytics queries
- ✅ Integration with Python AI agent for insights
- ✅ Redis caching support
- ✅ Tenant isolation

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL 14+
- Redis

### Installation

```bash
npm install
```

### Environment Variables

```env
DATABASE_URL=postgresql://user:password@localhost:5432/analytics_db
REDIS_URL=redis://localhost:6379
AI_AGENT_URL=http://localhost:8000
NODE_ENV=development
PORT=3001
```

### Development

```bash
npm run dev
```

### Build

```bash
npm run build
npm start
```

## API Endpoints

### Events

- `POST /api/v1/events` - Create event
- `GET /api/v1/events` - List events

### Workflows

- `POST /api/v1/workflows` - Create workflow
- `GET /api/v1/workflows` - List workflows
- `GET /api/v1/workflows/:id` - Get workflow
- `DELETE /api/v1/workflows/:id` - Delete workflow

### Analytics

- `GET /api/v1/analytics/funnels/:workflowId` - Get funnel analysis
- `GET /api/v1/analytics/insights/:workflowId` - Get AI insights

## Authentication

Include tenant ID in request headers:

```
x-tenant-id: your-tenant-id
```

## Testing

```bash
npm test
```
