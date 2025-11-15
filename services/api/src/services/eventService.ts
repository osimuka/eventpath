import axios from 'axios';
import { config } from '../config';

export interface EventInput {
  tenantId: string;
  eventName: string;
  userId?: string;
  sessionId?: string;
  properties?: Record<string, unknown>;
}

export interface FunnelAnalytics {
  workflowId: string;
  steps: Array<{
    step: number;
    eventName: string;
    count: number;
    dropOff: number;
  }>;
  conversionRate: number;
}

class EventService {
  async createEvent(event: EventInput) {
    // Store in database
    // For now, return mock response
    return {
      id: Math.random().toString(36),
      ...event,
      timestamp: new Date(),
    };
  }

  async listEvents(tenantId: string, options: { limit: number; offset: number }) {
    // Query events from database
    return [];
  }
}

class AnalyticsService {
  async getFunnelAnalytics(workflowId: string, tenantId: string): Promise<FunnelAnalytics | null> {
    // Query funnel data from database
    return null;
  }

  async getAIInsights(workflowId: string, tenantId: string) {
    try {
      const response = await axios.post(`${config.aiAgent.url}/explain-funnel`, {
        workflowId,
        tenantId,
      });
      return response.data;
    } catch (error) {
      console.error('Error calling AI agent:', error);
      throw error;
    }
  }
}

export const eventService = new EventService();
export const analyticsService = new AnalyticsService();
