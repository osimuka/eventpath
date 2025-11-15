import { Router, Request, Response } from 'express';
import { analyticsService } from '../services/eventService';

const router = Router();

/**
 * GET /api/v1/analytics/funnels/:workflowId
 * Get funnel analysis for workflow
 */
router.get('/funnels/:workflowId', async (req: Request, res: Response) => {
  try {
    const { workflowId } = req.params;
    const tenantId = req.headers['x-tenant-id'] as string;

    if (!tenantId) {
      return res.status(400).json({ error: 'Missing x-tenant-id header' });
    }

    const funnel = await analyticsService.getFunnelAnalytics(workflowId, tenantId);

    if (!funnel) {
      return res.status(404).json({ error: 'Funnel not found' });
    }

    res.json(funnel);
  } catch (error) {
    console.error('Error fetching funnel analytics:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/v1/analytics/insights/:workflowId
 * Get AI-powered insights for funnel
 */
router.get('/insights/:workflowId', async (req: Request, res: Response) => {
  try {
    const { workflowId } = req.params;
    const tenantId = req.headers['x-tenant-id'] as string;

    if (!tenantId) {
      return res.status(400).json({ error: 'Missing x-tenant-id header' });
    }

    const insights = await analyticsService.getAIInsights(workflowId, tenantId);

    res.json(insights);
  } catch (error) {
    console.error('Error fetching insights:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
