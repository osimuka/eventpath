# Python SDK

Server-side SDK for tracking events in Python applications.

## Installation

```bash
pip install analytics-sdk-python
```

## Usage

### Basic Setup

```python
from analytics_sdk import init

analytics = init(
    api_url='https://api.example.com',
    api_key='your-api-key'
)

# Identify user
analytics.identify('user-123', {
    'name': 'John Doe',
    'email': 'john@example.com',
})

# Track events
analytics.track('product_viewed', {
    'product_id': '456',
    'product_name': 'Widget',
    'price': 29.99,
})

analytics.track('add_to_cart', {
    'product_id': '456',
    'quantity': 2,
})

# Manually flush events
analytics.flush()
```

## Configuration

```python
Analytics(
    api_url='https://api.example.com',      # API endpoint
    api_key='your-api-key',                 # API key
    batch_size=10,                          # Events before auto-send
    flush_interval=5                        # Seconds between auto-flushes
)
```

## Threading

Events are sent in background thread. Safe for concurrent use with threading locks.

## Building

```bash
python setup.py build
```
