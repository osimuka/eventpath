# Developer Experience Guide

How developers interact with service-analytics from setup to insights.

---

## Phase 1: Installation & Setup (5 minutes)

### Step 1: Install SDK

**JavaScript/React:**

```bash
npm install @4onstudios/analytics-js
```

**Python/Django:**

```bash
pip install analytics-sdk-python
```

### Step 2: Get API Key

1. Log in to dashboard at `https://dashboard.analytics.4onstudios.com`
2. Create project → get API key (`sk_live_abc123`)
3. Copy API key to `.env`

**.env file:**

```env
REACT_APP_ANALYTICS_KEY=sk_live_abc123
REACT_APP_ANALYTICS_URL=https://api.analytics.4onstudios.com
```

### Step 3: Initialize in App

**React App (src/lib/analytics.ts):**

```typescript
import { init } from "@4onstudios/analytics-js";

export const analytics = init({
  apiKey: process.env.REACT_APP_ANALYTICS_KEY,
  apiUrl: process.env.REACT_APP_ANALYTICS_URL,
});
```

**Django (settings.py):**

```python
from analytics_sdk import init

ANALYTICS = init(
    api_key="sk_live_abc123",
    api_url="https://api.analytics.4onstudios.com"
)
```

---

## Phase 2: Define Custom Events (10 minutes)

### Step 1: Decide What Matters

Common event categories:

- **Authentication**: signup, login, logout
- **Engagement**: feature_used, page_viewed, content_shared
- **Commerce**: product_viewed, cart_updated, purchase_completed
- **Error**: error_occurred, api_failed

### Step 2: Define Event Schema

**TypeScript (src/analytics/events.ts):**

```typescript
export type AppEvents = {
  user_signed_up: {
    signupMethod: "email" | "google";
    plan: "free" | "pro";
  };
  purchase_completed: {
    orderId: string;
    amount: number;
    currency: string;
  };
};
```

**Python (analytics/events.py):**

```python
from typing import TypedDict, Literal

class UserSignedUpEvent(TypedDict):
    signup_method: Literal["email", "google"]
    plan: Literal["free", "pro"]

class PurchaseCompletedEvent(TypedDict):
    order_id: str
    amount: float
    currency: str
```

---

## Phase 3: Track Events (5 minutes per event)

### In React Component

```typescript
import { analytics } from "@/lib/analytics";

export function CheckoutButton() {
  const handleCheckout = async () => {
    // Track when checkout starts
    analytics.track("checkout_started", {
      cartValue: 99.99,
      itemCount: 2,
    });

    // ... handle checkout logic ...

    if (success) {
      // Track when purchase completes
      analytics.track("purchase_completed", {
        orderId: "order_123",
        amount: 99.99,
        currency: "USD",
      });
    }
  };

  return <button onClick={handleCheckout}>Buy Now</button>;
}
```

### In Django View

```python
from django.http import JsonResponse
from analytics.client import analytics

def checkout(request):
    analytics.track("checkout_started", {
        "cartValue": 99.99,
        "itemCount": 2,
    })

    # ... process payment ...

    analytics.track("purchase_completed", {
        "order_id": "order_123",
        "amount": 99.99,
        "currency": "USD",
    })

    return JsonResponse({"success": True})
```

**That's it!** Events are now being collected.

---

## Phase 4: Create Workflows in Dashboard (5 minutes)

1. Open dashboard
2. Go to "Workflows" → "New Workflow"
3. Define funnel steps:

```
Step 1: checkout_started
Step 2: purchase_completed
```

4. Click "Save"

Dashboard automatically shows:

- User count per step
- Drop-off rates
- Conversion rates

---

## Phase 5: Analyze & Optimize (ongoing)

### View Funnel Dashboard

Events are flowing → metrics appear automatically:

```
┌─────────────────────────────────────────┐
│        Checkout Funnel (Last 7 Days)    │
├─────────────────────────────────────────┤
│                                         │
│  Checkout Started                       │
│  ████████████████████  1,000 users      │
│                    ▼                    │
│  Purchase Completed                     │
│  ██████████████        600 users        │
│                                         │
│  Conversion Rate: 60%                   │
│  Drop-off: 40% (400 users)              │
│                                         │
└─────────────────────────────────────────┘
```

### Get AI Insights

Click "Explain" → AI agent analyzes:

```
📊 Funnel Analysis

Summary:
Your checkout has a 40% drop-off between steps.
This is 15% below industry average for e-commerce.

Key Drivers:
• Payment form is too complex (average 3.5 minutes)
• Mobile users drop off 2x more than desktop
• Users with promo codes convert better (75% vs 55%)

Suggestions:
1. Simplify payment form - reduce fields by 50%
2. Add mobile-specific checkout flow
3. Promote promo code usage in ads
```

### A/B Test Changes

Make changes → watch metrics improve:

```
Timeline:
Nov 8  - Simplified form
Nov 9  - Drop-off: 35% ✓ (was 40%)
Nov 10 - Add mobile flow
Nov 11 - Drop-off: 28% ✓ (was 35%)
```

---

## Complete Developer Journey

### Day 1: Setup

```
1. npm install @4onstudios/analytics-js        (2 min)
2. Copy API key to .env                        (1 min)
3. Initialize analytics in app.ts              (2 min)
4. Done! ✓
```

### Day 2-3: Track Events

```
1. Define AppEvents type                       (5 min)
2. Add analytics.track() in 5 components       (10 min)
3. Done! ✓ Events flowing
```

### Day 4: Analyze

```
1. Create workflow in dashboard                (5 min)
2. View funnel metrics                         (2 min)
3. Read AI insights                            (3 min)
4. Done! ✓ Actionable insights
```

### Week 2+: Optimize

```
1. Implement suggested improvements            (varies)
2. Track new metrics                           (10 min)
3. Compare before/after                        (5 min)
4. Repeat ✓
```

---

## Example: Complete E-commerce Setup

### Events Defined

```typescript
type ShopEvents = {
  // Browse
  product_viewed: { productId: string; price: number };
  product_searched: { query: string; resultCount: number };

  // Cart
  item_added: { productId: string; quantity: number };
  cart_abandoned: { cartValue: number; timeActive: number };

  // Checkout
  checkout_started: { cartValue: number };
  payment_attempted: { method: "card" | "paypal" };
  payment_failed: { reason: string };
  purchase_completed: { orderId: string; amount: number };

  // After purchase
  order_confirmed: { orderId: string };
  order_shipped: { trackingNumber: string };
  review_submitted: { rating: 1 | 2 | 3 | 4 | 5 };
};
```

### Workflows Created

**Workflow 1: Purchase Conversion**

```
Step 1: product_viewed
Step 2: item_added
Step 3: checkout_started
Step 4: purchase_completed
```

**Workflow 2: Payment Reliability**

```
Step 1: checkout_started
Step 2: payment_attempted
Step 3: purchase_completed
```

**Workflow 3: Post-Purchase Engagement**

```
Step 1: purchase_completed
Step 2: order_shipped
Step 3: review_submitted
```

### Insights Generated

```
Purchase Conversion Funnel
├─ Product Viewed: 10,000 users
├─ Item Added: 3,000 users (30% conversion)
├─ Checkout Started: 2,500 users (83% conversion)
└─ Purchase Completed: 1,500 users (60% conversion)

🔴 Main Issue: Drop between product_viewed and item_added
   Possible causes:
   • Product page doesn't clearly explain benefits
   • Add to cart button not visible/accessible
   • Price seems high compared to competitors

💡 Recommendations:
   1. Highlight product benefits above fold
   2. Make "Add to Cart" button larger/more prominent
   3. Show customer reviews/ratings early
```

---

## Developer Support Resources

### Documentation

- **SDK Reference**: Full API docs
- **Event Best Practices**: How to design good events
- **Troubleshooting**: Common issues & solutions

### Community

- **Discord**: Live support from team
- **GitHub Issues**: Report bugs, request features
- **Docs Site**: Tutorials & guides

### Examples

- **React SPA**: Full e-commerce example
- **Django App**: Full e-commerce example
- **Next.js**: SSR example with API routes
- **Python Backend**: Event tracking in workers

---

## Comparison: service-analytics vs Competitors

| Feature              | service-analytics | Segment       | Amplitude     | Custom Code         |
| -------------------- | ----------------- | ------------- | ------------- | ------------------- |
| **Setup Time**       | 5 minutes         | 15 minutes    | 20 minutes    | Hours               |
| **Learning Curve**   | Minimal           | Moderate      | Steep         | Steep               |
| **Type Safety**      | ✓ (TypeScript)    | Partial       | Partial       | ✗                   |
| **AI Insights**      | ✓ (Built-in)      | ✗ Add-on      | ✗ Add-on      | ✗                   |
| **Pricing**          | Usage-based       | Seats + usage | Seats + users | Hidden costs        |
| **Events/Month**     | Unlimited         | Depends       | Depends       | Scales with servers |
| **Time to Insights** | Instant           | Manual setup  | Manual setup  | Days/weeks          |

---

## Success Metrics

### After Day 1

- ✅ Events flowing to dashboard
- ✅ Can view in real-time

### After Week 1

- ✅ Funnels defined
- ✅ Drop-off points identified
- ✅ Baseline metrics established

### After Month 1

- ✅ A/B tests running
- ✅ Conversion rate improving
- ✅ ROI positive

### After 3 Months

- ✅ Product-wide insights
- ✅ Data-driven decisions
- ✅ Team aligned on metrics

---

## Troubleshooting

### Events Not Appearing

**Check:**

1. SDK initialized correctly
2. API key is valid
3. Network request succeeding (DevTools → Network)
4. Batch size threshold met or flush interval passed

```typescript
// Manual debug
analytics.track("debug_event", { test: true });
await analytics.flush();
```

### Wrong Data Type

**TypeScript will catch this:**

```typescript
// ❌ Error: quantity must be number
analytics.track("item_added", {
  productId: "123",
  quantity: "5", // String instead of number
});

// ✅ Correct
analytics.track("item_added", {
  productId: "123",
  quantity: 5,
});
```

### Too Many Events

**Solutions:**

1. Increase batch size

```typescript
init({ batchSize: 50 });
```

2. Increase flush interval

```typescript
init({ flushInterval: 30000 });
```

3. Debounce events

```typescript
const debouncedTrack = debounce(
  (name, props) => analytics.track(name, props),
  1000
);
```

---

## Next Steps

1. **Install SDK** (5 min)
2. **Add events** to 3-5 key flows (30 min)
3. **Create first workflow** (5 min)
4. **Share dashboard** with team
5. **Act on insights** 🚀

**Questions?** Join our Discord or email support@4onstudios.com

---

## One More Thing: White-Glove Setup

For enterprise customers, 4onstudios offers:

- **Onboarding call** with your team
- **Event audit** of your app
- **Custom dashboard** design
- **Monthly business review** with insights

Contact sales@4onstudios.com to learn more.
