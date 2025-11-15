import { Router, Request, Response } from 'express';
import { workflowService } from '../services/workflowService';
import { CreateWorkflowRequest } from '../types/events';

const router = Router();

/**
 * POST /api/v1/workflows
 * Create a new workflow
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const { name, description, events } = req.body as CreateWorkflowRequest;
    const tenantId = req.headers['x-tenant-id'] as string;

    if (!name || !events || events.length === 0) {
      return res.status(400).json({
        error: 'Missing required fields: name, events',
      });
    }

    const workflow = await workflowService.createWorkflow(tenantId, {
      name,
      description,
      events,
    });

    res.status(201).json(workflow);
  } catch (error) {
    console.error('Error creating workflow:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/v1/workflows
 * List workflows
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const tenantId = req.headers['x-tenant-id'] as string;

    if (!tenantId) {
      return res.status(400).json({ error: 'Missing x-tenant-id header' });
    }

    const workflows = await workflowService.listWorkflows(tenantId);
    res.json(workflows);
  } catch (error) {
    console.error('Error listing workflows:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/v1/workflows/:id
 * Get workflow details
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const tenantId = req.headers['x-tenant-id'] as string;

    if (!tenantId) {
      return res.status(400).json({ error: 'Missing x-tenant-id header' });
    }

    const workflow = await workflowService.getWorkflow(id, tenantId);

    if (!workflow) {
      return res.status(404).json({ error: 'Workflow not found' });
    }

    res.json(workflow);
  } catch (error) {
    console.error('Error fetching workflow:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * DELETE /api/v1/workflows/:id
 * Delete workflow
 */
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const tenantId = req.headers['x-tenant-id'] as string;

    if (!tenantId) {
      return res.status(400).json({ error: 'Missing x-tenant-id header' });
    }

    await workflowService.deleteWorkflow(id, tenantId);
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting workflow:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
