# Shared Types

TypeScript type definitions and interfaces shared across the service-analytics platform.

## Types

- `Event` - Event data structure
- `Workflow` - Workflow definition
- `FunnelAnalytics` - Funnel metrics
- `CreateEventRequest` - Event creation payload
- `CreateWorkflowRequest` - Workflow creation payload
- `Tenant` - Tenant information

## Usage

```typescript
import {
  Event,
  Workflow,
  FunnelAnalytics,
  CreateEventRequest,
  CreateWorkflowRequest,
} from "@service-analytics/shared-types";

const event: Event = {
  id: "123",
  tenantId: "tenant-1",
  eventName: "page_view",
  userId: "user-123",
  timestamp: new Date(),
};
```

## Publishing

```bash
npm publish
```
