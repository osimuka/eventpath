# AI Agent

LLM-powered microservice for analytics insights, funnel explanations, and anomaly detection.

## Features

- 🤖 Funnel explanation using GPT-4
- 🔍 Anomaly detection in event streams
- 💡 Actionable insights and recommendations
- 📊 Statistical analysis models

## Getting Started

### Prerequisites

- Python 3.10+
- Poetry (recommended) or pip

### Installation

```bash
poetry install
# or
pip install -r requirements.txt
```

### Environment Variables

```env
LOG_LEVEL=info
WORKERS=4
OPENAI_API_KEY=your-api-key-here
```

### Development

```bash
uvicorn ai_agent.main:app --reload
```

Server will be available at `http://localhost:8000`

### API Endpoints

- `POST /api/v1/explain-funnel` - Explain funnel behavior
- `POST /api/v1/suggest-insights` - Generate insights
- `GET /health` - Health check
- `GET /ready` - Readiness check

## Endpoints

### Explain Funnel

```bash
curl -X POST http://localhost:8000/api/v1/explain-funnel \
  -H "Content-Type: application/json" \
  -d '{
    "workflow_id": "checkout",
    "funnel_data": {
      "steps": [...],
      "conversion_rate": 0.15,
      "drop_off_points": [...]
    }
  }'
```

### Suggest Insights

```bash
curl -X POST http://localhost:8000/api/v1/suggest-insights \
  -H "Content-Type: application/json" \
  -d '{"workflow_id": "checkout", "time_period": "7d"}'
```

## Testing

```bash
pytest tests/
```

## Building

```bash
docker build -t analytics-ai-agent:latest .
```
