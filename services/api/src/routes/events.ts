import { Router, Request, Response } from 'express';
import { eventService } from '../services/eventService';
import { CreateEventRequest } from '../types/events';

const router = Router();

/**
 * POST /api/v1/events
 * Ingest new event
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const { eventName, userId, sessionId, properties } = req.body as CreateEventRequest;
    const tenantId = req.headers['x-tenant-id'] as string;

    if (!eventName || !tenantId) {
      return res.status(400).json({
        error: 'Missing required fields: eventName, x-tenant-id header',
      });
    }

    const event = await eventService.createEvent({
      tenantId,
      eventName,
      userId,
      sessionId,
      properties,
    });

    res.status(201).json(event);
  } catch (error) {
    console.error('Error creating event:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/v1/events
 * List events for tenant
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const tenantId = req.headers['x-tenant-id'] as string;
    const { limit = 100, offset = 0 } = req.query;

    if (!tenantId) {
      return res.status(400).json({ error: 'Missing x-tenant-id header' });
    }

    const events = await eventService.listEvents(tenantId, {
      limit: parseInt(limit as string, 10),
      offset: parseInt(offset as string, 10),
    });

    res.json(events);
  } catch (error) {
    console.error('Error listing events:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
