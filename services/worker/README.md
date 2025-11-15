# Worker Service

Background job processor for event handling, funnel tracking, and data aggregation.

## Features

- 🔄 Job queue with Bull/BullMQ
- 📦 Event batch processing
- 📊 Funnel progression tracking
- 🔔 Retries and error handling

## Getting Started

### Installation

```bash
npm install
```

### Environment Variables

```env
REDIS_HOST=localhost
REDIS_PORT=6379
DATABASE_URL=postgresql://user:password@localhost:5432/analytics_db
```

### Development

```bash
npm run dev
```

## Jobs

### Event Processing

Events are queued for background processing:

```typescript
// Process events
// - Store in database
// - Track funnel progression
// - Calculate metrics
```

## Building

```bash
npm run build
npm start
```

## Docker

```bash
docker build -t analytics-worker:latest .
docker run analytics-worker:latest
```
