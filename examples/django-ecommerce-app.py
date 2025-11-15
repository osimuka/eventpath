"""
Example: Django E-commerce App Using service-analytics
Shows how a Python developer would use the SDK for tracking custom events
"""

# ============================================================
# Step 1: Define your custom events (type hints)
# ============================================================

# analytics/events.py

from typing import TypedDict, Literal, Optional

class UserSignupEvent(TypedDict):
    signup_method: Literal["email", "google", "github"]
    account_plan: Literal["free", "pro", "enterprise"]
    referral_code: Optional[str]

class ProductViewedEvent(TypedDict):
    product_id: str
    product_name: str
    category: str
    price: float
    in_stock: bool

class ItemAddedToCartEvent(TypedDict):
    product_id: str
    product_name: str
    quantity: int
    price: float
    cart_total: float

class CheckoutStartedEvent(TypedDict):
    cart_value: float
    currency: str
    item_count: int
    has_promo_code: bool

class CheckoutCompletedEvent(TypedDict):
    order_id: str
    cart_value: float
    currency: str
    item_count: int
    payment_method: Literal["credit_card", "paypal", "apple_pay"]
    transaction_id: str
    discount_amount: Optional[float]
    shipping_cost: float

class ReviewSubmittedEvent(TypedDict):
    product_id: str
    rating: Literal[1, 2, 3, 4, 5]
    review_length: int


# ============================================================
# Step 2: Initialize analytics in your Django app
# ============================================================

# analytics/client.py

from typing import Dict, Any
from analytics_sdk import init

# Initialize the analytics client
analytics = init(
    api_url="http://localhost:3001/api/v1",
    api_key="dev_key_123"
)

def identify_user(user_id: str, email: str, account_type: str):
    """Identify current user for tracking."""
    analytics.identify(user_id, {
        "email": email,
        "accountType": account_type,
        "identifiedAt": __import__('datetime').datetime.now().isoformat(),
    })


# ============================================================
# Step 3: Use analytics in your views
# ============================================================

# ecommerce/views.py

from django.shortcuts import render, redirect
from django.http import JsonResponse
from django.views.decorators.http import require_http_methods
from django.contrib.auth.decorators import login_required
from .models import Product, Order, Cart, Review
from analytics.client import analytics, identify_user
from analytics.events import (
    ProductViewedEvent,
    CheckoutStartedEvent,
    CheckoutCompletedEvent,
    ReviewSubmittedEvent,
)


# ---- Product Views ----

@login_required
def product_detail(request, product_id):
    """Product detail page with event tracking."""
    product = Product.objects.get(id=product_id)
    
    # Track product view
    analytics.track("product_viewed", {
        "product_id": product.id,
        "product_name": product.name,
        "category": product.category,
        "price": float(product.price),
        "in_stock": product.stock > 0,
    })
    
    return render(request, "product/detail.html", {"product": product})


@require_http_methods(["GET"])
def search_products(request):
    """Search products with event tracking."""
    query = request.GET.get("q", "")
    results = Product.objects.filter(name__icontains=query)
    
    # Track search event
    analytics.track("product_search", {
        "searchQuery": query,
        "resultsCount": results.count(),
        "filters": {"category": "all"},
    })
    
    return JsonResponse([
        {"id": p.id, "name": p.name, "price": float(p.price)}
        for p in results
    ], safe=False)


# ---- Cart Views ----

@login_required
@require_http_methods(["POST"])
def add_to_cart(request):
    """Add item to cart with event tracking."""
    product_id = request.POST.get("product_id")
    quantity = int(request.POST.get("quantity", 1))
    
    product = Product.objects.get(id=product_id)
    cart, created = Cart.objects.get_or_create(user=request.user)
    
    # Add to cart logic...
    cart_item = cart.items.create(product=product, quantity=quantity)
    
    cart_total = sum(item.product.price * item.quantity for item in cart.items.all())
    
    # Track add to cart
    analytics.track("item_added_to_cart", {
        "product_id": str(product.id),
        "product_name": product.name,
        "quantity": quantity,
        "price": float(product.price),
        "cartTotal": float(cart_total),
    })
    
    return redirect("cart:view")


@login_required
def view_cart(request):
    """View shopping cart."""
    cart = Cart.objects.get(user=request.user)
    return render(request, "cart/view.html", {"cart": cart})


# ---- Checkout Views ----

@login_required
@require_http_methods(["GET"])
def checkout_page(request):
    """Checkout page with event tracking."""
    cart = Cart.objects.get(user=request.user)
    cart_value = sum(item.product.price * item.quantity for item in cart.items.all())
    item_count = sum(item.quantity for item in cart.items.all())
    promo_code = request.GET.get("promo", "")
    
    # Track checkout started
    analytics.track("checkout_started", {
        "cartValue": float(cart_value),
        "currency": "USD",
        "itemCount": item_count,
        "hasPromoCode": bool(promo_code),
    })
    
    return render(request, "checkout/page.html", {
        "cart": cart,
        "cart_value": cart_value,
    })


@login_required
@require_http_methods(["POST"])
def process_payment(request):
    """Process payment with event tracking."""
    import json
    import stripe
    
    data = json.loads(request.body)
    payment_method = data.get("payment_method")  # "credit_card", "paypal", etc.
    
    # Track payment entered
    analytics.track("checkout_payment_entered", {
        "paymentMethod": payment_method,
        "cardType": "visa" if payment_method == "credit_card" else None,
    })
    
    try:
        # Process payment with Stripe, PayPal, etc.
        # ... payment logic ...
        
        # Create order
        cart = Cart.objects.get(user=request.user)
        cart_value = sum(item.product.price * item.quantity for item in cart.items.all())
        item_count = sum(item.quantity for item in cart.items.all())
        
        order = Order.objects.create(
            user=request.user,
            total_amount=cart_value,
            payment_method=payment_method,
        )
        
        # Clear cart
        cart.items.all().delete()
        
        # Track successful purchase
        analytics.track("checkout_completed", {
            "orderId": str(order.id),
            "cartValue": float(cart_value),
            "currency": "USD",
            "itemCount": item_count,
            "paymentMethod": payment_method,
            "transactionId": "txn_12345",  # from payment provider
            "discountAmount": None,
            "shippingCost": 5.99,
        })
        
        return JsonResponse({
            "success": True,
            "orderId": order.id,
            "transactionId": "txn_12345",
        })
    
    except Exception as e:
        # Track failed checkout
        analytics.track("checkout_failed", {
            "reason": "payment_declined",
            "cartValue": float(cart_value),
        })
        
        return JsonResponse({
            "success": False,
            "error": str(e),
        }, status=400)


@login_required
def order_confirmation(request, order_id):
    """Order confirmation page with event tracking."""
    order = Order.objects.get(id=order_id, user=request.user)
    
    # Track order confirmed
    import datetime
    analytics.track("order_confirmed", {
        "orderId": str(order.id),
        "estimatedDelivery": (
            datetime.datetime.now() + datetime.timedelta(days=5)
        ).isoformat(),
    })
    
    # Simulate order shipped after a delay
    # (In production, use Celery or similar)
    def ship_order():
        import time
        time.sleep(2)
        
        analytics.track("order_shipped", {
            "orderId": str(order.id),
            "trackingNumber": f"TRACK{order.id}",
            "carrier": "FedEx",
        })
    
    import threading
    threading.Thread(target=ship_order, daemon=True).start()
    
    return render(request, "order/confirmation.html", {"order": order})


# ---- Review Views ----

@login_required
@require_http_methods(["POST"])
def submit_review(request, product_id):
    """Submit product review with event tracking."""
    import json
    
    data = json.loads(request.body)
    rating = int(data.get("rating"))
    review_text = data.get("reviewText", "")
    
    product = Product.objects.get(id=product_id)
    
    # Create review
    review = Review.objects.create(
        product=product,
        user=request.user,
        rating=rating,
        text=review_text,
    )
    
    # Track review submitted
    analytics.track("review_submitted", {
        "productId": str(product.id),
        "rating": rating,
        "reviewLength": len(review_text),
    })
    
    return JsonResponse({"success": True, "reviewId": review.id})


# ---- Auth Views ----

def signup(request):
    """User signup with event tracking."""
    if request.method == "POST":
        email = request.POST.get("email")
        password = request.POST.get("password")
        plan = request.POST.get("plan", "free")  # free, pro, enterprise
        signup_method = request.POST.get("method", "email")  # email, google, github
        
        from django.contrib.auth.models import User
        
        # Create user
        user = User.objects.create_user(
            username=email,
            email=email,
            password=password,
        )
        
        # Identify and track signup
        identify_user(str(user.id), email, plan)
        analytics.track("user_signed_up", {
            "signupMethod": signup_method,
            "accountPlan": plan,
            "referralCode": request.POST.get("referral_code"),
        })
        
        # Log user in
        from django.contrib.auth import login
        login(request, user)
        
        return redirect("products:list")
    
    return render(request, "auth/signup.html")


# ============================================================
# Step 4: Django URL Configuration
# ============================================================

# ecommerce/urls.py

from django.urls import path
from . import views

app_name = "ecommerce"

urlpatterns = [
    # Products
    path("products/<int:product_id>/", views.product_detail, name="product_detail"),
    path("search/", views.search_products, name="search"),
    
    # Cart
    path("cart/add/", views.add_to_cart, name="add_to_cart"),
    path("cart/", views.view_cart, name="view_cart"),
    
    # Checkout
    path("checkout/", views.checkout_page, name="checkout"),
    path("checkout/payment/", views.process_payment, name="process_payment"),
    
    # Orders
    path("order/<int:order_id>/", views.order_confirmation, name="order_confirmation"),
    
    # Reviews
    path("product/<int:product_id>/review/", views.submit_review, name="submit_review"),
    
    # Auth
    path("signup/", views.signup, name="signup"),
]


# ============================================================
# Step 5: Template Example (HTML/Django Template)
# ============================================================

# templates/checkout/page.html

"""
{% load static %}
<!DOCTYPE html>
<html>
<head>
    <title>Checkout</title>
</head>
<body>
    <h1>Checkout</h1>
    <div class="cart-summary">
        <p>Total: ${{ cart_value }}</p>
    </div>
    
    <div class="payment-methods">
        <label>
            <input type="radio" name="payment" value="credit_card">
            Credit Card
        </label>
        <label>
            <input type="radio" name="payment" value="paypal">
            PayPal
        </label>
    </div>
    
    <button id="complete-purchase">Complete Purchase</button>
    
    <script>
        document.getElementById('complete-purchase').addEventListener('click', async () => {
            const paymentMethod = document.querySelector('input[name="payment"]:checked').value;
            
            const response = await fetch('{% url "ecommerce:process_payment" %}', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({payment_method: paymentMethod}),
            });
            
            const data = await response.json();
            if (data.success) {
                window.location.href = '/order/' + data.orderId + '/';
            }
        });
    </script>
</body>
</html>
"""


# ============================================================
# That's it! A Django developer now has:
# ✅ Simple event tracking with type hints
# ✅ Auto-batching and queuing in background
# ✅ Full funnel analytics
# ✅ AI-powered insights
#
# No complex analytics infrastructure needed!
# ============================================================
