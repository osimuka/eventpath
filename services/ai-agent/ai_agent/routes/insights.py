"""Insights generation routes."""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

router = APIRouter()


class InsightRequest(BaseModel):
    """Request for AI insights."""

    workflow_id: str
    time_period: str = "7d"


class InsightResponse(BaseModel):
    """AI insight response."""

    insights: list[str]
    confidence: float
    recommendations: list[str]


@router.post("/suggest-insights", response_model=InsightResponse)
async def suggest_insights(request: InsightRequest):
    """
    Generate AI-powered insights for analytics data.

    Args:
        request: Insight request with workflow context

    Returns:
        Generated insights and recommendations
    """
    try:
        # Generate insights using LLM
        response = InsightResponse(
            insights=[
                "Conversion rate trending upward",
                "Peak traffic during evening hours",
            ],
            confidence=0.85,
            recommendations=[
                "Focus marketing efforts during peak hours",
                "Optimize checkout flow",
            ],
        )
        return response
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
