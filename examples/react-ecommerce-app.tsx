/**
 * Example: E-commerce React App Using service-analytics
 * Shows how a developer would use the SDK for tracking custom events
 */

// ============================================================
// Step 1: Define your custom events (type-safe)
// ============================================================

// src/analytics/events.ts

export type AppEvents = {
  // Authentication flows
  "user_signed_up": {
    signupMethod: "email" | "google" | "github";
    accountPlan: "free" | "pro" | "enterprise";
    referralCode?: string;
  };

  "user_logged_in": {
    method: "email" | "sso" | "password";
    loginDuration?: number; // seconds to login
  };

  // Product browsing
  "product_viewed": {
    productId: string;
    productName: string;
    category: string;
    price: number;
    inStock: boolean;
  };

  "product_search": {
    searchQuery: string;
    resultsCount: number;
    filters?: Record<string, string>;
  };

  // Shopping cart
  "item_added_to_cart": {
    productId: string;
    productName: string;
    quantity: number;
    price: number;
    cartTotal: number;
  };

  "cart_abandoned": {
    cartValue: number;
    itemCount: number;
    minutesActive: number;
  };

  // Checkout flow
  "checkout_started": {
    cartValue: number;
    currency: string;
    itemCount: number;
    hasPromoCode: boolean;
  };

  "checkout_payment_entered": {
    paymentMethod: "credit_card" | "paypal" | "apple_pay" | "google_pay";
    cardType?: "visa" | "mastercard" | "amex";
  };

  "checkout_completed": {
    orderId: string;
    cartValue: number;
    currency: string;
    itemCount: number;
    paymentMethod: "credit_card" | "paypal" | "apple_pay" | "google_pay";
    transactionId: string;
    discountAmount?: number;
    shippingCost: number;
  };

  "checkout_failed": {
    reason: "payment_declined" | "network_error" | "timeout" | "user_cancelled";
    cartValue: number;
  };

  // Post-purchase
  "order_confirmed": {
    orderId: string;
    estimatedDelivery: string;
  };

  "order_shipped": {
    orderId: string;
    trackingNumber: string;
    carrier: string;
  };

  "review_submitted": {
    productId: string;
    rating: 1 | 2 | 3 | 4 | 5;
    reviewLength: number;
  };
};

// ============================================================
// Step 2: Initialize analytics in your app
// ============================================================

// src/lib/analytics.ts

import { createAnalytics } from "@4onstudios/analytics-js";
import type { AppEvents } from "./events";

export const analytics = createAnalytics<AppEvents>({
  apiKey: process.env.REACT_APP_ANALYTICS_KEY || "dev_key_123",
  apiUrl:
    process.env.REACT_APP_ANALYTICS_URL ||
    "http://localhost:3001/api/v1",
  batchSize: 15,
  flushInterval: 10000,
});

export function identifyUser(
  userId: string,
  email: string,
  accountType: "free" | "pro" | "enterprise"
) {
  analytics.identify(userId, {
    email,
    accountType,
    identifiedAt: new Date().toISOString(),
  });
}

// ============================================================
// Step 3: Use analytics in your components
// ============================================================

// src/components/ProductCard.tsx

import React from "react";
import { analytics } from "@/lib/analytics";

interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  inStock: boolean;
}

export function ProductCard({ product }: { product: Product }) {
  const handleViewProduct = () => {
    // TypeScript ensures all properties match the event definition!
    analytics.track("product_viewed", {
      productId: product.id,
      productName: product.name,
      category: product.category,
      price: product.price,
      inStock: product.inStock,
    });
  };

  const handleAddToCart = (quantity: number) => {
    const cartTotal = product.price * quantity;

    analytics.track("item_added_to_cart", {
      productId: product.id,
      productName: product.name,
      quantity,
      price: product.price,
      cartTotal,
    });
  };

  React.useEffect(() => {
    handleViewProduct();
  }, [product.id]);

  return (
    <div className="border rounded p-4">
      <h3 className="font-bold">{product.name}</h3>
      <p className="text-gray-600">${product.price}</p>
      <button onClick={() => handleAddToCart(1)} className="bg-blue-500 text-white px-4 py-2">
        Add to Cart
      </button>
    </div>
  );
}

// src/components/SearchBox.tsx

import React, { useState } from "react";
import { analytics } from "@/lib/analytics";

export function SearchBox() {
  const [query, setQuery] = useState("");

  const handleSearch = async (searchQuery: string) => {
    const results = await fetch(`/api/products?q=${searchQuery}`).then((r) =>
      r.json()
    );

    // Track the search event
    analytics.track("product_search", {
      searchQuery,
      resultsCount: results.length,
      filters: { category: "all" },
    });

    setQuery("");
  };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        handleSearch(query);
      }}
    >
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search products..."
      />
      <button type="submit">Search</button>
    </form>
  );
}

// src/pages/Cart.tsx

import React, { useState, useEffect } from "react";
import { analytics } from "@/lib/analytics";

export default function CartPage() {
  const [cart, setCart] = useState([]);
  const [abandonedAt, setAbandonedAt] = useState<number | null>(null);

  useEffect(() => {
    // Track when user enters cart but doesn't checkout
    const timer = setTimeout(() => {
      if (cart.length > 0) {
        const totalValue = cart.reduce((sum, item) => sum + item.price * item.qty, 0);

        analytics.track("cart_abandoned", {
          cartValue: totalValue,
          itemCount: cart.length,
          minutesActive: 5, // after 5 minutes
        });

        setAbandonedAt(Date.now());
      }
    }, 5 * 60 * 1000); // 5 minutes

    return () => clearTimeout(timer);
  }, [cart]);

  return (
    <div>
      <h1>Shopping Cart</h1>
      {/* Render cart items */}
    </div>
  );
}

// src/pages/Checkout.tsx

import React, { useState } from "react";
import { analytics } from "@/lib/analytics";

export default function CheckoutPage() {
  const [cart] = useState([
    { id: "prod_1", name: "Widget", price: 29.99, qty: 2 },
    { id: "prod_2", name: "Gadget", price: 49.99, qty: 1 },
  ]);

  const [paymentMethod, setPaymentMethod] = useState<"credit_card" | "paypal" | null>(null);
  const [promoCode, setPromoCode] = useState("");

  const cartValue = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
  const itemCount = cart.reduce((sum, item) => sum + item.qty, 0);

  const handleCheckoutStart = () => {
    analytics.track("checkout_started", {
      cartValue,
      currency: "USD",
      itemCount,
      hasPromoCode: !!promoCode,
    });
  };

  const handlePaymentMethodSelect = (method: "credit_card" | "paypal" | "apple_pay" | "google_pay") => {
    const cardType = method === "credit_card" ? "visa" : undefined;

    analytics.track("checkout_payment_entered", {
      paymentMethod: method,
      cardType,
    });

    setPaymentMethod(method as any);
  };

  const handlePurchase = async () => {
    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        body: JSON.stringify({
          cart,
          paymentMethod,
          promoCode,
        }),
      }).then((r) => r.json());

      if (response.success) {
        // Track successful purchase
        analytics.track("checkout_completed", {
          orderId: response.orderId,
          cartValue,
          currency: "USD",
          itemCount,
          paymentMethod: paymentMethod || "credit_card",
          transactionId: response.transactionId,
          discountAmount: promoCode ? 10 : undefined,
          shippingCost: 5.99,
        });

        // Redirect to success page
        window.location.href = `/order-confirmation/${response.orderId}`;
      } else {
        // Track failed checkout
        analytics.track("checkout_failed", {
          reason: "payment_declined",
          cartValue,
        });
      }
    } catch (error) {
      analytics.track("checkout_failed", {
        reason: "network_error",
        cartValue,
      });
    }
  };

  return (
    <div className="space-y-6">
      <button onClick={handleCheckoutStart} className="bg-blue-500 text-white px-4 py-2">
        Start Checkout
      </button>

      <div>
        <h2 className="font-bold mb-3">Payment Method</h2>
        <button
          onClick={() => handlePaymentMethodSelect("credit_card")}
          className={`mr-2 px-4 py-2 ${paymentMethod === "credit_card" ? "bg-blue-500 text-white" : "border"}`}
        >
          Credit Card
        </button>
        <button
          onClick={() => handlePaymentMethodSelect("paypal")}
          className={`px-4 py-2 ${paymentMethod === "paypal" ? "bg-blue-500 text-white" : "border"}`}
        >
          PayPal
        </button>
      </div>

      <div>
        <label>Promo Code:</label>
        <input value={promoCode} onChange={(e) => setPromoCode(e.target.value)} />
      </div>

      <button onClick={handlePurchase} className="bg-green-500 text-white px-6 py-2 text-lg">
        Complete Purchase (${cartValue.toFixed(2)})
      </button>
    </div>
  );
}

// src/pages/OrderConfirmation.tsx

import React, { useEffect } from "react";
import { useParams } from "react-router-dom";
import { analytics } from "@/lib/analytics";

export default function OrderConfirmationPage() {
  const { orderId } = useParams<{ orderId: string }>();

  useEffect(() => {
    analytics.track("order_confirmed", {
      orderId: orderId || "",
      estimatedDelivery: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
    });

    // Simulate order shipped after 2 seconds
    const timer = setTimeout(() => {
      analytics.track("order_shipped", {
        orderId: orderId || "",
        trackingNumber: "TRACK123456",
        carrier: "FedEx",
      });
    }, 2000);

    return () => clearTimeout(timer);
  }, [orderId]);

  return (
    <div className="text-center space-y-4">
      <h1 className="text-2xl font-bold">Order Confirmed!</h1>
      <p>Order ID: {orderId}</p>
      <p>Estimated delivery: 5 days</p>
    </div>
  );
}

// src/pages/ReviewPage.tsx

import React, { useState } from "react";
import { analytics } from "@/lib/analytics";

interface ReviewProps {
  productId: string;
}

export function ReviewForm({ productId }: ReviewProps) {
  const [rating, setRating] = useState<1 | 2 | 3 | 4 | 5 | null>(null);
  const [reviewText, setReviewText] = useState("");

  const handleSubmitReview = () => {
    if (!rating) return;

    analytics.track("review_submitted", {
      productId,
      rating,
      reviewLength: reviewText.length,
    });

    setRating(null);
    setReviewText("");
  };

  return (
    <div className="space-y-4">
      <div>
        <label>Rating:</label>
        <div className="flex gap-2">
          {[1, 2, 3, 4, 5].map((r) => (
            <button
              key={r}
              onClick={() => setRating(r as any)}
              className={`w-10 h-10 rounded ${
                rating === r ? "bg-yellow-500" : "bg-gray-200"
              }`}
            >
              {r}★
            </button>
          ))}
        </div>
      </div>

      <textarea
        value={reviewText}
        onChange={(e) => setReviewText(e.target.value)}
        placeholder="Write your review..."
        className="w-full border p-2"
      />

      <button
        onClick={handleSubmitReview}
        className="bg-blue-500 text-white px-4 py-2"
      >
        Submit Review
      </button>
    </div>
  );
}

// ============================================================
// Step 4: Main App Setup
// ============================================================

// src/main.tsx

import React, { useEffect } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { identifyUser } from "@/lib/analytics";
import ProductCard from "@/components/ProductCard";
import CheckoutPage from "@/pages/Checkout";
import OrderConfirmationPage from "@/pages/OrderConfirmation";

function App() {
  useEffect(() => {
    // Get current user (from auth/session)
    const currentUser = {
      id: "user_123",
      email: "alice@example.com",
      accountType: "pro" as const,
    };

    // Identify user to analytics
    identifyUser(currentUser.id, currentUser.email, currentUser.accountType);
  }, []);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/products" element={<ProductCard />} />
        <Route path="/checkout" element={<CheckoutPage />} />
        <Route path="/order/:orderId" element={<OrderConfirmationPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;

// ============================================================
// That's it! The developer now has:
// ✅ Type-safe event tracking
// ✅ Auto-batching and queuing
// ✅ Full funnel analytics
// ✅ AI-powered insights
//
// No backend code needed!
// ============================================================
