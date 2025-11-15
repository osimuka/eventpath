export interface Event {
  id: string;
  tenantId: string;
  eventName: string;
  userId?: string;
  sessionId?: string;
  properties?: Record<string, unknown>;
  timestamp: Date;
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

export interface FunnelSession {
  userId: string;
  sessionId: string;
  completedStep: number;
  totalSteps: number;
  completedAt?: Date;
}

export interface CreateEventRequest {
  eventName: string;
  userId?: string;
  sessionId?: string;
  properties?: Record<string, unknown>;
}

export interface CreateWorkflowRequest {
  name: string;
  description?: string;
  events: string[];
}
