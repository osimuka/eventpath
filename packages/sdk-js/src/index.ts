/**
 * JavaScript SDK for service-analytics
 * Provides simple event tracking and user identification
 */

export interface AnalyticsConfig {
  apiUrl: string;
  apiKey: string;
  batchSize?: number;
  flushInterval?: number;
}

export interface EventData {
  eventName: string;
  properties?: Record<string, unknown>;
}

export class Analytics {
  private config: AnalyticsConfig;
  private queue: EventData[] = [];
  private flushTimer: NodeJS.Timeout | null = null;
  private userId: string | null = null;
  private sessionId: string;

  constructor(config: AnalyticsConfig) {
    this.config = {
      batchSize: 10,
      flushInterval: 5000,
      ...config,
    };
    this.sessionId = this.generateSessionId();
  }

  /**
   * Identify user for tracking
   */
  public identify(userId: string, traits?: Record<string, unknown>): void {
    this.userId = userId;
    // Send identify event
  }

  /**
   * Track an event
   */
  public track(eventName: string, properties?: Record<string, unknown>): void {
    const event: EventData = {
      eventName,
      properties,
    };
    this.queue.push(event);

    if (this.queue.length >= (this.config.batchSize || 10)) {
      this.flush();
    } else if (!this.flushTimer) {
      this.flushTimer = setTimeout(() => this.flush(), this.config.flushInterval || 5000);
    }
  }

  /**
   * Flush queued events to server
   */
  public async flush(): Promise<void> {
    if (this.queue.length === 0) return;

    const events = this.queue.splice(0, this.queue.length);

    try {
      await fetch(`${this.config.apiUrl}/api/v1/events`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.config.apiKey,
        },
        body: JSON.stringify({
          events: events.map((event) => ({
            ...event,
            userId: this.userId,
            sessionId: this.sessionId,
            timestamp: new Date(),
          })),
        }),
      });
    } catch (error) {
      console.error('Failed to send events:', error);
      // Re-add events to queue on failure
      this.queue.unshift(...events);
    }

    if (this.flushTimer) {
      clearTimeout(this.flushTimer);
      this.flushTimer = null;
    }
  }

  private generateSessionId(): string {
    return `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}

export function init(config: AnalyticsConfig): Analytics {
  return new Analytics(config);
}

export default { init, Analytics };
