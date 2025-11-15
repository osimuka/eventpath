"""Funnel explanation routes."""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from ai_agent.models.funnel_explainer import FunnelExplainer, ExplanationRequest

router = APIRouter()
explainer = FunnelExplainer()


class FunnelExplanationResponse(BaseModel):
    """Funnel explanation response."""

    summary: str
    drop_off_analysis: list[dict]
    suggestions: list[str]


@router.post("/explain-funnel", response_model=FunnelExplanationResponse)
async def explain_funnel(request: ExplanationRequest):
    """
    Explain funnel behavior and drop-off points.

    Args:
        request: Funnel data and context

    Returns:
        Explanation with suggestions
    """
    try:
        result = await explainer.explain_funnel(request)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
