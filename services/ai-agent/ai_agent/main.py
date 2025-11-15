"""Main FastAPI application for AI agent microservice."""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from ai_agent.routes import explain, insights

app = FastAPI(title="Analytics AI Agent", version="1.0.0")

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(explain.router, prefix="/api/v1", tags=["explanations"])
app.include_router(insights.router, prefix="/api/v1", tags=["insights"])


@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "ok"}


@app.get("/ready")
async def readiness_check():
    """Readiness check endpoint."""
    return {"ready": True}
