# Event Flow Architecture & API Reference

Complete technical reference for how custom events flow through service-analytics.

---

## Event Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                     DEVELOPER APP (React/Django/etc.)           │
│                                                                   │
│  analytics.track("checkout_completed", {                        │
│    cartValue: 99.99,                                            │
│    currency: "USD",                                             │
│    ...                                                          │
│  })                                                             │
└────────────────────┬────────────────────────────────────────────┘
                     │
                     ▼ (batch & queue)
┌─────────────────────────────────────────────────────────────────┐
│                    SDK (JavaScript/Python)                       │
│                                                                   │
│  • Collects events                                              │
│  • Batches (default: 10 events or 5 sec)                        │
│  • Adds userId, sessionId, timestamp                            │
│  • Serializes as JSON                                           │
└────────────────────┬────────────────────────────────────────────┘
                     │
              HTTP POST /api/v1/events
              Content-Type: application/json
              x-api-key: dev_key_123
                     │
                     ▼
┌─────────────────────────────────────────────────────────────────┐
│                   API Service (Node.js)                         │
│                                                                  │
│  POST /api/v1/events                                            │
│  ├─ Validate batch format                                       │
│  ├─ Authenticate API key → get tenant                           │
│  ├─ Enrich with received_at, source                             │
│  └─ Return 202 Accepted (async processing)                      │
└────────────────────┬────────────────────────────────────────────┘
                     │
              ┌──────┴──────┬──────────┐
              │             │          │
              ▼             ▼          ▼
        ┌─────────┐  ┌──────────┐  ┌─────────┐
        │ Database│  │   Redis  │  │  Worker │
        │ (Postgres)  │  Queue   │  │ Process │
        └─────────┘  └──────────┘  └─────────┘
              │             │          │
              └──────┬──────┴──────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────────┐
│            Analytics Engine (Queries + AI Agent)                │
│                                                                  │
│  • Compute funnel metrics                                       │
│  • Detect anomalies                                             │
│  • Call AI agent for explanations                               │
└────────────────────┬────────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Dashboard (React)                             │
│                                                                  │
│  • Display funnel charts                                        │
│  • Show AI insights                                             │
│  • Offer recommendations                                        │
└─────────────────────────────────────────────────────────────────┘
```

---

## 1. SDK Event Capture

### JavaScript/TypeScript

```typescript
// Initialize
import { init } from "@4onstudios/analytics-js";

const analytics = init({
  apiKey: "sk_live_abc123",
  apiUrl: "https://api.analytics.4onstudios.com",
  batchSize: 10, // Flush after 10 events
  flushInterval: 5000, // Or after 5 seconds
});

// Track event (buffered locally)
analytics.track("checkout_completed", {
  orderId: "order_123",
  cartValue: 99.99,
  currency: "USD",
});

// Identify user
analytics.identify("user_123", {
  email: "alice@example.com",
  accountType: "pro",
});

// Manual flush (optional)
await analytics.flush();
```

**What happens locally:**

```javascript
// Internal queue
{
  queue: [
    {
      type: "track",
      name: "checkout_completed",
      properties: { orderId: "order_123", cartValue: 99.99, currency: "USD" },
      userId: null,
      anonymousId: "anon_abc123",
      timestamp: "2025-11-15T10:00:00Z"
    }
  ],
  sessionId: "session-1731655200000-abc123xyz",
  userId: null
}
```

### Python

```python
from analytics_sdk import init

analytics = init(
    api_url="https://api.analytics.4onstudios.com",
    api_key="sk_live_abc123"
)

# Track event
analytics.track("checkout_completed", {
    "orderId": "order_123",
    "cartValue": 99.99,
    "currency": "USD",
})

# Identify user
analytics.identify("user_123", {
    "email": "alice@example.com",
    "accountType": "pro",
})

# Manual flush
analytics.flush()
```

---

## 2. Batch Payload Format

When SDK sends events to the API, it batches them:

```json
{
  "batch": [
    {
      "type": "identify",
      "userId": "user_123",
      "traits": {
        "email": "alice@example.com",
        "accountType": "pro"
      },
      "timestamp": "2025-11-15T10:00:00Z",
      "context": {
        "source": "js",
        "userAgent": "Mozilla/5.0...",
        "page": "/checkout"
      }
    },
    {
      "type": "track",
      "name": "checkout_completed",
      "userId": "user_123",
      "anonymousId": null,
      "properties": {
        "orderId": "order_123",
        "cartValue": 99.99,
        "currency": "USD"
      },
      "timestamp": "2025-11-15T10:00:30Z",
      "context": {
        "source": "js",
        "userAgent": "Mozilla/5.0...",
        "page": "/checkout"
      }
    }
  ]
}
```

---

## 3. API Ingestion Endpoint

### Request

```
POST /api/v1/events HTTP/1.1
Host: api.analytics.4onstudios.com
Content-Type: application/json
x-api-key: sk_live_abc123
Content-Length: 1024

{
  "batch": [...]
}
```

### Response (202 Accepted)

```json
{
  "status": "accepted",
  "eventCount": 2,
  "queuedId": "batch_1731655200000",
  "processingAt": "2025-11-15T10:00:30Z"
}
```

### Error Responses

```json
{
  "error": "Invalid API key",
  "code": "AUTH_FAILED"
}
```

Status codes:

- `202 Accepted` - Events queued for processing
- `400 Bad Request` - Invalid batch format
- `401 Unauthorized` - Invalid API key
- `429 Too Many Requests` - Rate limited
- `500 Internal Server Error` - Server error

---

## 4. API Service Processing

```typescript
// services/api/src/routes/events.ts

router.post("/", async (req: Request, res: Response) => {
  const { batch } = req.body;
  const apiKey = req.headers["x-api-key"] as string;

  // 1. Validate
  if (!Array.isArray(batch)) {
    return res.status(400).json({ error: "batch must be array" });
  }

  // 2. Authenticate
  const tenant = await getTenantByApiKey(apiKey);
  if (!tenant) {
    return res.status(401).json({ error: "Invalid API key" });
  }

  // 3. Process
  const batchId = `batch_${Date.now()}`;
  const processedCount = await processEventBatch(batch, tenant.id);

  // 4. Queue for async processing
  await redisQueue.push("event:process", { batchId, tenantId: tenant.id });

  // 5. Return 202 immediately (async)
  return res.status(202).json({
    status: "accepted",
    eventCount: batch.length,
    queuedId: batchId,
  });
});

async function processEventBatch(batch: any[], tenantId: string) {
  const results = await Promise.all(
    batch.map(async (event) => {
      if (event.type === "track") {
        // Store track event
        return prisma.event.create({
          data: {
            tenantId,
            eventName: event.name,
            userId: event.userId,
            anonymousId: event.anonymousId,
            properties: event.properties,
            source: event.context?.source,
            timestamp: new Date(event.timestamp),
            receivedAt: new Date(),
          },
        });
      } else if (event.type === "identify") {
        // Upsert user identity
        return prisma.userIdentity.upsert({
          where: { tenantId_userId: { tenantId, userId: event.userId } },
          update: {
            traits: event.traits,
            lastSeenAt: new Date(event.timestamp),
          },
          create: {
            tenantId,
            userId: event.userId,
            traits: event.traits,
            createdAt: new Date(event.timestamp),
          },
        });
      }
    })
  );

  return results.length;
}
```

---

## 5. Database Schema

```sql
-- Events table
CREATE TABLE events (
  id BIGSERIAL PRIMARY KEY,
  tenant_id INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  event_name VARCHAR(255) NOT NULL,
  user_id VARCHAR(255),
  anonymous_id VARCHAR(255),
  session_id VARCHAR(255),
  properties JSONB NOT NULL DEFAULT '{}',
  source VARCHAR(50),
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
  received_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

  -- Indexes for common queries
  INDEX idx_tenant_event (tenant_id, event_name),
  INDEX idx_tenant_timestamp (tenant_id, timestamp DESC),
  INDEX idx_user_session (user_id, session_id),
  INDEX idx_event_name (event_name),

  PARTITION BY RANGE (timestamp)  -- Optional: for large datasets
);

-- User identities table
CREATE TABLE user_identities (
  id SERIAL PRIMARY KEY,
  tenant_id INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id VARCHAR(255) NOT NULL,
  traits JSONB NOT NULL DEFAULT '{}',
  first_seen_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  last_seen_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

  UNIQUE(tenant_id, user_id),
  INDEX idx_tenant_user (tenant_id, user_id)
);

-- Workflows/funnels table
CREATE TABLE workflows (
  id SERIAL PRIMARY KEY,
  tenant_id INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  events JSONB NOT NULL,  -- Array of step definitions
  created_by_user_id INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

  INDEX idx_tenant_workflow (tenant_id)
);
```

---

## 6. Query Funnel Metrics

Once events are stored, query them to build analytics:

```typescript
// services/api/src/services/funnelService.ts

export async function analyzeFunnel(
  workflowId: string,
  tenantId: string,
  timeWindow = "7d"
) {
  // Parse time window
  const startDate = new Date(Date.now() - parseDuration(timeWindow));

  // Get workflow
  const workflow = await prisma.workflow.findUnique({
    where: { id: workflowId },
  });

  const eventNames: string[] = workflow.events;

  // Get unique user counts per step
  const steps = await Promise.all(
    eventNames.map(async (eventName, idx) => {
      const query = await prisma.event.findMany({
        where: {
          tenantId,
          eventName,
          timestamp: { gte: startDate },
        },
        distinct: ["userId"],
        select: { userId: true },
      });

      const userCount = query.length;
      return { position: idx + 1, eventName, userCount };
    })
  );

  // Calculate drop-offs
  const enrichedSteps = steps.map((step, idx) => {
    if (idx === 0) return { ...step, dropOff: 0 };

    const prevCount = steps[idx - 1].userCount;
    const currentCount = step.userCount;
    const dropOff = ((prevCount - currentCount) / prevCount) * 100;

    return {
      ...step,
      dropOff: Math.round(dropOff),
      conversionFromPrevious: 100 - dropOff,
    };
  });

  const totalConversion =
    (steps[steps.length - 1].userCount / steps[0].userCount) * 100;

  return {
    workflowId,
    timeWindow,
    steps: enrichedSteps,
    overallConversion: Math.round(totalConversion),
    totalUsers: steps[0].userCount,
  };
}
```

Example query result:

```json
{
  "workflowId": "flow_checkout",
  "timeWindow": "7d",
  "steps": [
    {
      "position": 1,
      "eventName": "checkout_started",
      "userCount": 1000,
      "dropOff": 0,
      "conversionFromPrevious": 100
    },
    {
      "position": 2,
      "eventName": "checkout_payment_entered",
      "userCount": 750,
      "dropOff": 25,
      "conversionFromPrevious": 75
    },
    {
      "position": 3,
      "eventName": "checkout_completed",
      "userCount": 600,
      "dropOff": 20,
      "conversionFromPrevious": 80
    }
  ],
  "overallConversion": 60,
  "totalUsers": 1000
}
```

---

## 7. Call AI Agent for Insights

```typescript
// services/api/src/services/aiClient.ts

export async function explainFunnel(
  funnelData: FunnelAnalyticsData,
  segment?: Record<string, string>
) {
  const payload = {
    funnel: {
      workflow_id: funnelData.workflowId,
      steps: funnelData.steps.map((s, idx) => ({
        name: s.eventName,
        event: s.eventName,
        position: idx + 1,
      })),
      counts: funnelData.steps.map((s) => s.userCount),
      time_window: funnelData.timeWindow,
    },
    segment,
  };

  try {
    const response = await axios.post(
      `${process.env.AI_AGENT_URL}/explain-funnel`,
      payload,
      { timeout: 30000 }
    );

    return response.data;
  } catch (error) {
    console.error("AI agent error:", error);
    throw new Error("Failed to generate insights");
  }
}
```

---

## 8. Querying Specific User Events

```typescript
// Get all events for a specific user
export async function getUserEvents(userId: string, limit = 100) {
  return prisma.event.findMany({
    where: { userId },
    orderBy: { timestamp: "desc" },
    take: limit,
  });
}

// Example result:
[
  {
    id: 1001,
    eventName: "checkout_completed",
    properties: {
      orderId: "order_123",
      cartValue: 99.99,
      currency: "USD",
    },
    timestamp: "2025-11-15T10:05:00Z",
    userId: "user_123",
  },
  {
    id: 1000,
    eventName: "checkout_started",
    properties: {
      cartValue: 99.99,
      currency: "USD",
      itemCount: 2,
    },
    timestamp: "2025-11-15T10:00:00Z",
    userId: "user_123",
  },
];
```

---

## 9. Event Property Validation

Ensure event properties match schema:

```typescript
// types/events.ts

export interface EventSchema {
  [eventName: string]: {
    [propertyName: string]:
      | "string"
      | "number"
      | "boolean"
      | "array"
      | "object";
  };
}

export const eventSchemas: EventSchema = {
  checkout_completed: {
    orderId: "string",
    cartValue: "number",
    currency: "string",
    itemCount: "number",
    paymentMethod: "string",
    transactionId: "string",
  },
  product_viewed: {
    productId: "string",
    productName: "string",
    category: "string",
    price: "number",
    inStock: "boolean",
  },
};

export function validateEvent(
  eventName: string,
  properties: Record<string, unknown>
): { valid: boolean; errors: string[] } {
  const schema = eventSchemas[eventName];
  if (!schema) {
    return { valid: false, errors: [`Unknown event: ${eventName}`] };
  }

  const errors: string[] = [];

  for (const [propName, expectedType] of Object.entries(schema)) {
    const value = properties[propName];

    if (value === undefined) {
      errors.push(`Missing required property: ${propName}`);
      continue;
    }

    const actualType = Array.isArray(value) ? "array" : typeof value;
    if (actualType !== expectedType) {
      errors.push(
        `Property ${propName}: expected ${expectedType}, got ${actualType}`
      );
    }
  }

  return { valid: errors.length === 0, errors };
}
```

---

## 10. Rate Limiting & Quotas

```typescript
// Middleware for rate limiting
import { RateLimiterMemory } from "rate-limiter-flexible";

const rateLimiter = new RateLimiterMemory({
  points: 10000, // 10k requests
  duration: 60, // per 60 seconds
});

router.post("/", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const apiKey = req.headers["x-api-key"] as string;
    await rateLimiter.consume(apiKey, 1);
    next();
  } catch (error) {
    return res.status(429).json({
      error: "Rate limit exceeded",
      retryAfter: 60,
    });
  }
});
```

---

## Summary: Complete Event Lifecycle

1. **SDK captures** - Developer calls `analytics.track()`
2. **SDK batches** - Collects events, sends when threshold met
3. **API validates** - Checks auth, format, schema
4. **DB stores** - Events persisted to PostgreSQL
5. **Indexing** - Fast queries on tenant, event, user
6. **Analytics** - Compute funnels, drop-offs
7. **AI analysis** - Send to Python agent for insights
8. **Dashboard** - Display results to developer

**No infrastructure management needed!** 🚀
