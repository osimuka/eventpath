"""Test suite for funnel explanation."""

import pytest
from ai_agent.models.funnel_explainer import FunnelExplainer, ExplanationRequest, FunnelData


@pytest.fixture
def explainer():
    """Create explainer instance."""
    return FunnelExplainer()


@pytest.mark.asyncio
async def test_explain_funnel(explainer):
    """Test funnel explanation."""
    request = ExplanationRequest(
        workflow_id="test-workflow",
        funnel_data=FunnelData(
            steps=[
                {"step": 1, "event": "page_view", "count": 1000},
                {"step": 2, "event": "add_to_cart", "count": 300},
                {"step": 3, "event": "checkout", "count": 100},
            ],
            conversion_rate=0.1,
            drop_off_points=[
                {"step": 1, "drop_off": 70},
                {"step": 2, "drop_off": 67},
            ],
        ),
    )

    result = await explainer.explain_funnel(request)
    assert "summary" in result
    assert "drop_off_analysis" in result
    assert "suggestions" in result
