/**
 * Shared event types and interfaces for service-analytics
 */

export interface Event {
  id: string;
  tenantId: string;
  eventName: string;
  userId?: string;
  sessionId?: string;
  properties?: Record<string, unknown>;
  timestamp: Date;
}

export interface CreateEventRequest {
  eventName: string;
  userId?: string;
  sessionId?: string;
  properties?: Record<string, unknown>;
}

export interface Workflow {
  id: string;
  tenantId: string;
  name: string;
  description?: string;
  events: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateWorkflowRequest {
  name: string;
  description?: string;
  events: string[];
}

export interface FunnelStep {
  step: number;
  eventName: string;
  count: number;
  dropOff: number;
  dropOffRate: number;
}

export interface FunnelAnalytics {
  workflowId: string;
  steps: FunnelStep[];
  totalUsers: number;
  conversionRate: number;
  bottomDropOff: FunnelStep[];
}

export interface Tenant {
  id: string;
  name: string;
  apiKey: string;
  createdAt: Date;
}

export type EventHandler = (event: Event) => Promise<void>;
