# Custom Events Guide

Complete guide on how developers define, track, and analyze custom events in service-analytics.

## Overview

Custom events are the core of analytics. Developers define events that matter to their business, track them in their app, and service-analytics handles ingestion, storage, and analysis.

**Flow:**

```
Developer App → SDK.track() → API (/events) → Database → AI Analysis
                         ↓
                    Batched & Queued
```

---

## 1. Define Custom Events (Type-Safe)

### JavaScript/TypeScript Apps

Create an `events.ts` file in your app:

```typescript
// src/analytics/events.ts

/**
 * Define all custom events your app tracks.
 * TypeScript will enforce correct property shapes.
 */
export type AppEvents = {
  // Authentication
  user_signup: {
    signupMethod: "email" | "google" | "github";
    accountPlan: "free" | "pro" | "enterprise";
  };

  // Checkout flow
  checkout_started: {
    cartValue: number;
    currency: string;
    itemCount: number;
  };

  checkout_completed: {
    cartValue: number;
    currency: string;
    itemCount: number;
    paymentMethod: "credit_card" | "paypal" | "apple_pay";
    transactionId: string;
  };

  checkout_abandoned: {
    cartValue: number;
    currency: string;
    abandonmentReason?: "price" | "payment_issue" | "user_left";
  };

  // Feature usage
  feature_used: {
    featureName: string;
    duration: number; // milliseconds
  };

  report_exported: {
    format: "pdf" | "csv" | "json";
    rowCount: number;
  };
};
```

### Python Apps

```python
# analytics/events.py

from typing import TypedDict, Literal

class UserSignupEvent(TypedDict):
    signupMethod: Literal["email", "google", "github"]
    accountPlan: Literal["free", "pro", "enterprise"]

class CheckoutStartedEvent(TypedDict):
    cartValue: float
    currency: str
    itemCount: int

class CheckoutCompletedEvent(TypedDict):
    cartValue: float
    currency: str
    itemCount: int
    paymentMethod: Literal["credit_card", "paypal", "apple_pay"]
    transactionId: str

# Map event names to their property types
AppEvents = {
    "user_signup": UserSignupEvent,
    "checkout_started": CheckoutStartedEvent,
    "checkout_completed": CheckoutCompletedEvent,
}
```

---

## 2. Initialize SDK in Your App

### JavaScript/TypeScript

```typescript
// src/lib/analytics.ts

import { createAnalytics } from "@4onstudios/analytics-js";
import type { AppEvents } from "./events";

export const analytics = createAnalytics<AppEvents>({
  apiKey: process.env.REACT_APP_ANALYTICS_KEY,
  apiUrl:
    process.env.REACT_APP_ANALYTICS_URL ||
    "https://api.analytics.4onstudios.com",
  batchSize: 15, // Send after 15 events
  flushInterval: 10000, // Or every 10 seconds
});

// Identify the current user
export function setCurrentUser(userId: string, email: string) {
  analytics.identify(userId, {
    email,
    signupDate: new Date().toISOString(),
  });
}
```

**Usage in React component:**

```typescript
// src/pages/Checkout.tsx

import React, { useState } from "react";
import { analytics } from "@/lib/analytics";

export default function Checkout() {
  const [cartValue] = useState(129.99);
  const [itemCount] = useState(3);

  const handleCheckoutStart = () => {
    // TypeScript enforces all required properties!
    analytics.track("checkout_started", {
      cartValue,
      currency: "USD",
      itemCount,
    });
    // ❌ This would error (TypeScript):
    // analytics.track("checkout_started", { cartValue });
  };

  const handleCheckoutComplete = (txnId: string) => {
    analytics.track("checkout_completed", {
      cartValue,
      currency: "USD",
      itemCount,
      paymentMethod: "credit_card",
      transactionId: txnId,
    });
  };

  return (
    <div>
      <button onClick={handleCheckoutStart}>Start Checkout</button>
      <button onClick={() => handleCheckoutComplete("txn_abc123")}>
        Complete Purchase
      </button>
    </div>
  );
}
```

### Python

```python
# ecommerce_app.py

from analytics.client import init
from analytics.events import AppEvents

analytics = init(
    api_url="https://api.analytics.4onstudios.com",
    api_key="your_api_key"
)

def on_user_signup(user_id: str, method: str, plan: str):
    """Track when a user signs up."""
    analytics.identify(user_id, {
        "email": f"user_{user_id}@example.com",
        "signup_date": "2025-11-15",
    })

    analytics.track("user_signup", {
        "signupMethod": method,  # "email", "google", or "github"
        "accountPlan": plan,      # "free", "pro", or "enterprise"
    })

def on_checkout_start(user_id: str, cart_value: float):
    """Track checkout initiation."""
    analytics.track("checkout_started", {
        "cartValue": cart_value,
        "currency": "USD",
        "itemCount": 3,
    })

def on_purchase(user_id: str, cart_value: float, txn_id: str):
    """Track completed purchase."""
    analytics.track("checkout_completed", {
        "cartValue": cart_value,
        "currency": "USD",
        "itemCount": 3,
        "paymentMethod": "credit_card",
        "transactionId": txn_id,
    })

# Usage
on_user_signup("user_123", "email", "free")
on_checkout_start("user_123", 129.99)
on_purchase("user_123", 129.99, "txn_abc123")
```

---

## 3. Event Payload Format (What SDK Sends)

When the SDK batches and sends events, it transforms them into this format:

```json
{
  "batch": [
    {
      "type": "identify",
      "userId": "user_123",
      "traits": {
        "email": "alice@example.com",
        "signupDate": "2025-11-15T10:00:00Z"
      },
      "timestamp": "2025-11-15T10:05:00Z",
      "context": {
        "source": "js",
        "userAgent": "Mozilla/5.0..."
      }
    },
    {
      "type": "track",
      "name": "checkout_started",
      "userId": "user_123",
      "anonymousId": "anon_abc123",
      "properties": {
        "cartValue": 129.99,
        "currency": "USD",
        "itemCount": 3
      },
      "timestamp": "2025-11-15T10:05:30Z",
      "context": {
        "source": "js",
        "page": "/checkout",
        "referrer": "https://example.com"
      }
    }
  ]
}
```

---

## 4. Backend Event Ingestion

### API Endpoint

```typescript
// services/api/src/routes/events.ts

import { Router, Request, Response } from "express";
import { eventService } from "../services/eventService";

const router = Router();

/**
 * POST /api/v1/events
 * Ingest batch of events (track + identify calls)
 *
 * @body { batch: Event[] }
 * @header x-api-key - API key for authentication
 * @header x-tenant-id - Tenant identifier (optional, derived from API key)
 */
router.post("/", async (req: Request, res: Response) => {
  try {
    const { batch } = req.body;
    const apiKey = req.headers["x-api-key"] as string;

    if (!batch || !Array.isArray(batch)) {
      return res.status(400).json({
        error: "Invalid request: batch array required",
      });
    }

    // Authenticate and get tenant
    const tenant = await eventService.getTenantByApiKey(apiKey);
    if (!tenant) {
      return res.status(401).json({ error: "Invalid API key" });
    }

    // Process batch
    const result = await eventService.ingestBatch(batch, tenant.id);

    // Return 202 Accepted (async processing)
    res.status(202).json({
      status: "accepted",
      eventCount: batch.length,
      queuedId: result.batchId,
    });
  } catch (error) {
    console.error("Error ingesting events:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
```

### Event Service Processing

```typescript
// services/api/src/services/eventService.ts

import { PrismaClient } from "@prisma/client";
import { Redis } from "redis";

const prisma = new PrismaClient();
const redis = new Redis();

export const eventService = {
  async getTenantByApiKey(apiKey: string) {
    return prisma.tenant.findUnique({
      where: { apiKey },
    });
  },

  async ingestBatch(batch: any[], tenantId: string) {
    // 1. Enrich events with timestamp, context
    const enrichedBatch = batch.map((event) => ({
      ...event,
      tenantId,
      receivedAt: new Date(),
      source: event.context?.source || "unknown",
    }));

    // 2. Store in database
    const stored = await Promise.all(
      enrichedBatch.map((event) => {
        if (event.type === "track") {
          return prisma.event.create({
            data: {
              tenantId,
              eventName: event.name,
              userId: event.userId,
              anonymousId: event.anonymousId,
              sessionId: event.context?.sessionId,
              properties: event.properties,
              timestamp: new Date(event.timestamp),
              source: event.source,
            },
          });
        } else if (event.type === "identify") {
          return prisma.userIdentity.upsert({
            where: {
              tenantId_userId: {
                tenantId,
                userId: event.userId,
              },
            },
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

    // 3. Queue for async processing (funnel tracking, aggregations)
    const batchId = `batch_${Date.now()}`;
    await redis.lpush("event:processing:queue", batchId);
    await redis.setex(batchId, 86400, JSON.stringify(enrichedBatch));

    return { batchId, processedCount: stored.length };
  },

  async listEvents(tenantId: string, limit = 100, offset = 0) {
    return prisma.event.findMany({
      where: { tenantId },
      take: limit,
      skip: offset,
      orderBy: { timestamp: "desc" },
    });
  },
};
```

---

## 5. Database Schema

```sql
-- Create tables for custom events

CREATE TABLE events (
  id SERIAL PRIMARY KEY,
  tenant_id INTEGER NOT NULL REFERENCES tenants(id),
  event_name VARCHAR(255) NOT NULL,
  user_id VARCHAR(255),
  anonymous_id VARCHAR(255),
  session_id VARCHAR(255),
  properties JSONB,           -- Stores custom properties
  source VARCHAR(50),         -- "js", "python", "mobile", etc.
  timestamp TIMESTAMP NOT NULL,
  received_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  INDEX idx_tenant_event (tenant_id, event_name),
  INDEX idx_tenant_timestamp (tenant_id, timestamp),
  INDEX idx_user_id (user_id, session_id)
);

CREATE TABLE user_identities (
  id SERIAL PRIMARY KEY,
  tenant_id INTEGER NOT NULL REFERENCES tenants(id),
  user_id VARCHAR(255) NOT NULL,
  traits JSONB,               -- User profile data
  last_seen_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  UNIQUE(tenant_id, user_id),
  INDEX idx_tenant_user (tenant_id, user_id)
);

CREATE TABLE workflows (
  id SERIAL PRIMARY KEY,
  tenant_id INTEGER NOT NULL REFERENCES tenants(id),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  events JSONB,               -- Array of step definitions
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  INDEX idx_tenant_workflow (tenant_id)
);
```

---

## 6. Define Workflows in Your Dashboard

Once events are flowing, developers define workflows/funnels in your web UI:

**Example workflow definition (JSON):**

```json
{
  "id": "flow_checkout_2024",
  "name": "Checkout Flow",
  "description": "Tracks user progression through checkout",
  "steps": [
    {
      "position": 1,
      "eventName": "checkout_started",
      "label": "Checkout Started"
    },
    {
      "position": 2,
      "eventName": "checkout_completed",
      "label": "Purchase Completed"
    }
  ]
}
```

**API to create workflow:**

```typescript
// POST /api/v1/workflows
router.post("/", async (req: Request, res: Response) => {
  try {
    const { name, description, steps } = req.body;
    const tenantId = req.headers["x-tenant-id"] as string;

    const workflow = await prisma.workflow.create({
      data: {
        tenantId,
        name,
        description,
        events: steps.map((s) => s.eventName),
      },
    });

    res.status(201).json(workflow);
  } catch (error) {
    res.status(500).json({ error: "Failed to create workflow" });
  }
});
```

---

## 7. Query Events & Build Funnel Analytics

Once events are stored, query them to build funnel analytics:

```typescript
// services/api/src/services/funnelService.ts

export const funnelService = {
  async analyzeFunnel(workflowId: string, tenantId: string, timeWindow = "7d") {
    const workflow = await prisma.workflow.findUnique({
      where: { id: workflowId },
    });

    const eventNames = workflow.events; // e.g. ["checkout_started", "checkout_completed"]
    const startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    // Get unique user counts per step
    const steps = await Promise.all(
      eventNames.map(async (eventName, idx) => {
        const uniqueUsers = await prisma.event.findMany({
          where: {
            tenantId,
            eventName,
            timestamp: { gte: startDate },
          },
          distinct: ["userId"],
          select: { userId: true },
        });

        return {
          position: idx + 1,
          eventName,
          userCount: uniqueUsers.length,
        };
      })
    );

    // Calculate drop-offs
    const funnelData = steps.map((step, idx) => {
      const prevCount =
        idx > 0 ? steps[idx - 1].userCount : steps[idx].userCount;
      const dropOff =
        idx > 0 ? ((prevCount - step.userCount) / prevCount) * 100 : 0;

      return {
        ...step,
        dropOff: Math.round(dropOff),
        conversionFromPrevious: 100 - dropOff,
      };
    });

    return {
      workflowId,
      timeWindow,
      steps: funnelData,
      overallConversion:
        (steps[steps.length - 1].userCount / steps[0].userCount) * 100,
    };
  },
};
```

---

## 8. Call AI Agent for Insights

Once you have funnel data, send it to the Python AI agent for analysis:

```typescript
// services/api/src/routes/analytics.ts

import { Router, Request, Response } from "express";
import { funnelService } from "../services/funnelService";
import { aiClient } from "../services/aiClient";

const router = Router();

/**
 * POST /api/v1/analytics/funnels/:workflowId/explain
 * Get AI explanation of funnel behavior
 */
router.post(
  "/funnels/:workflowId/explain",
  async (req: Request, res: Response) => {
    try {
      const { workflowId } = req.params;
      const { timeWindow = "7d", segment } = req.body;
      const tenantId = req.headers["x-tenant-id"] as string;

      // 1. Get funnel data
      const funnelData = await funnelService.analyzeFunnel(
        workflowId,
        tenantId,
        timeWindow
      );

      // 2. Call AI agent
      const explanation = await aiClient.explainFunnel({
        workflow_id: workflowId,
        funnel: {
          steps: funnelData.steps.map((s) => ({
            name: s.eventName,
            event: s.eventName,
            position: s.position,
          })),
          counts: funnelData.steps.map((s) => s.userCount),
          time_window: timeWindow,
        },
        segment,
      });

      res.json({
        workflowId,
        timeWindow,
        funnelData,
        aiExplanation: explanation,
      });
    } catch (error) {
      console.error("Error:", error);
      res.status(500).json({ error: "Failed to analyze funnel" });
    }
  }
);

export default router;
```

---

## 9. Display Results in Dashboard

The React frontend calls the analytics endpoint and displays results:

```typescript
// src/pages/Analytics.tsx

import React, { useEffect, useState } from "react";
import { api } from "@/lib/apiClient";
import FunnelChart from "@/components/FunnelChart";

export default function Analytics() {
  const [funnel, setFunnel] = useState(null);
  const [explanation, setExplanation] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadFunnelAnalysis();
  }, []);

  const loadFunnelAnalysis = async () => {
    setLoading(true);
    try {
      const response = await api.post(
        "/analytics/funnels/flow_checkout_2024/explain",
        {
          timeWindow: "7d",
        }
      );

      setFunnel(response.data.funnelData);
      setExplanation(response.data.aiExplanation);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="space-y-8">
      {/* Funnel Visualization */}
      {funnel && <FunnelChart data={funnel.steps} />}

      {/* AI Explanation */}
      {explanation && (
        <div className="bg-blue-50 p-6 rounded">
          <h2 className="font-bold mb-4">AI Insights</h2>
          <p className="mb-4">{explanation.summary}</p>

          <div className="mb-4">
            <h3 className="font-semibold mb-2">Key Drivers:</h3>
            <ul className="list-disc pl-5">
              {explanation.key_drivers.map((driver, i) => (
                <li key={i}>{driver}</li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-2">Suggestions:</h3>
            <ol className="list-decimal pl-5">
              {explanation.suggestions.map((suggestion, i) => (
                <li key={i}>{suggestion}</li>
              ))}
            </ol>
          </div>
        </div>
      )}
    </div>
  );
}
```

---

## 10. Complete End-to-End Example

### Developer's perspective (minimal code):

```typescript
// Their app: src/main.tsx

import React from "react";
import { analytics, setCurrentUser } from "@/lib/analytics";

function App() {
  React.useEffect(() => {
    // Identify the user
    setCurrentUser("user_123", "alice@example.com");
  }, []);

  return (
    <div>
      <CheckoutFlow />
    </div>
  );
}

function CheckoutFlow() {
  const handleCheckout = async () => {
    // Step 1: Start checkout
    analytics.track("checkout_started", {
      cartValue: 99.99,
      currency: "USD",
      itemCount: 2,
    });

    // Simulate API call...
    const txnId = await submitPayment();

    // Step 2: Complete checkout
    if (txnId) {
      analytics.track("checkout_completed", {
        cartValue: 99.99,
        currency: "USD",
        itemCount: 2,
        paymentMethod: "credit_card",
        transactionId: txnId,
      });
    }
  };

  return <button onClick={handleCheckout}>Buy Now</button>;
}
```

### Service-analytics flow:

1. ✅ SDK batches events → sends to API
2. ✅ API validates & stores in PostgreSQL
3. ✅ Events indexed and queryable
4. ✅ Developer defines workflow in dashboard
5. ✅ Backend queries funnel metrics
6. ✅ AI agent explains drop-offs
7. ✅ Dashboard displays insights

**Developer didn't touch backend code. Just sent events.**

---

## Best Practices

### 1. Event Naming

Use snake_case, past tense:

```typescript
❌ Poor naming
"user_creates_project"
"addToCart"

✅ Good naming
"project_created"
"checkout_started"
"item_added_to_cart"
```

### 2. Property Structure

Keep properties flat and simple:

```typescript
❌ Nested properties (harder to query)
{
  "user": { "id": "123", "name": "Alice" },
  "checkout": { "items": { "count": 2 } }
}

✅ Flat structure
{
  "userId": "123",
  "userName": "Alice",
  "itemCount": 2
}
```

### 3. PII Handling

Never track passwords, credit cards, or full SSNs:

```typescript
✅ Safe
{
  "email": "alice@example.com",
  "cardLastFour": "4242",
  "signupCountry": "US"
}

❌ Never
{
  "email": "alice@example.com",
  "creditCard": "4111111111111111"
}
```

### 4. Frequency

Don't fire events on every keystroke:

```typescript
❌ Too frequent
<input onChange={() => analytics.track("text_typed", ...)} />

✅ Reasonable
<form onSubmit={() => analytics.track("form_submitted", ...)} />
```

---

## Summary

**For developers using service-analytics:**

1. Define custom events with types
2. Call `analytics.track(name, properties)` in your app
3. Optionally call `analytics.identify(userId, traits)`
4. SDK batches and sends to `/api/v1/events`
5. Create workflows in dashboard
6. Get funnel metrics + AI insights automatically

**No backend work needed** — just send good events! 🎯
