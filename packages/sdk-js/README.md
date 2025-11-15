# JavaScript SDK

Client-side SDK for tracking events in JavaScript/TypeScript applications.

## Installation

```bash
npm install @service-analytics/sdk-js
```

## Usage

### Basic Setup

```typescript
import { init } from "@service-analytics/sdk-js";

const analytics = init({
  apiUrl: "https://api.example.com",
  apiKey: "your-api-key",
});

// Identify user
analytics.identify("user-123", {
  name: "John Doe",
  email: "john@example.com",
});

// Track events
analytics.track("product_viewed", {
  productId: "456",
  productName: "Widget",
  price: 29.99,
});

analytics.track("add_to_cart", {
  productId: "456",
  quantity: 2,
});

// Manually flush events
await analytics.flush();
```

## Configuration

```typescript
interface AnalyticsConfig {
  apiUrl: string; // API endpoint
  apiKey: string; // API authentication key
  batchSize?: number; // Events before auto-send (default: 10)
  flushInterval?: number; // Milliseconds between auto-flushes (default: 5000)
}
```

## Events

Events are batched and sent periodically. Customize batch behavior:

```typescript
const analytics = init({
  apiUrl: "https://api.example.com",
  apiKey: "your-api-key",
  batchSize: 20, // Send after 20 events
  flushInterval: 10000, // Send every 10 seconds
});
```

## Building

```bash
npm run build
```

Output is in `dist/` directory.
