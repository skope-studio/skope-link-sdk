/**
 * Configuration object for initializing the SDK.
 */
type SDKConfig = {
  /** The API key to authenticate requests. */
  apiKey: string;
  /** The base URL of the analytics endpoint. */
  endpoint: string;
  /** (Optional) The user ID to associate with tracked events. */
  userId?: string;
  /** (Optional) The number of events to batch before sending. Defaults to 10. */
  batchSize?: number;
  /** (Optional) The number of retry attempts in case of a failure. Defaults to 3. */
  retryAttempts?: number;
};

/**
 * SkopeLink SDK for tracking analytics events.
 */
export class SkopeLinkSdk {
  /** SDK configuration settings. */
  private config!: SDKConfig;
  /** Queue to store events before sending. */
  private eventQueue: any[] = [];
  /** Indicates if a flush operation is in progress. */
  private isFlushing = false;

  /**
   * Initializes the SDK with the provided configuration.
   * @param config - The configuration object for the SDK.
   * @throws Error if `apiKey` or `endpoint` is missing.
   */
  init(config: SDKConfig): void {
    if (!config.apiKey || !config.endpoint) {
      throw new Error('API Key and Endpoint are required for initialization.');
    }
    this.config = {
      ...config,
      batchSize: config.batchSize || 10,
      retryAttempts: config.retryAttempts || 3,
    };
  }

  /**
   * Tracks an event by adding it to the queue. Sends the queue if it reaches the batch size.
   * @param eventName - The name of the event to track.
   * @param eventData - Additional data related to the event.
   * @returns void
   * @example
   * sdk.track('user_signup', { plan: 'premium' });
   */
  track(eventName: string, eventData: Record<string, any>): void {
    if (!this.config) {
      console.warn('SDK not initialized. Call init() before tracking events.');
      return;
    }

    const event = {
      event_name: eventName,
      event_properties: {
        ...eventData,
        userId: this.config.userId,
      },
      session_id: this.generateSessionId(),
      source: 'sdk', // Adjust as needed
    };

    this.eventQueue.push(event);

    if (
      this.config.batchSize &&
      this.eventQueue.length >= this.config.batchSize
    ) {
      this.flush();
    }
  }

  /**
   * Sends all queued events to the analytics endpoint.
   * @returns A promise that resolves when the flush operation completes.
   * @example
   * await sdk.flush();
   */
  async flush(): Promise<void> {
    if (this.isFlushing || this.eventQueue.length === 0) {
      return;
    }

    this.isFlushing = true;

    const eventsToSend = [...this.eventQueue];
    this.eventQueue = [];

    try {
      const response = await fetch(`${this.config.endpoint}/analytics/track`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'api-key': this.config.apiKey,
        },
        body: JSON.stringify(eventsToSend),
      });

      if (!response.ok) {
        throw new Error(`Failed to send events: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Error sending events, requeuing:', error);
      this.eventQueue = [...eventsToSend, ...this.eventQueue];
    } finally {
      this.isFlushing = false;
    }
  }

  /**
   * Generates a unique session ID for tracking events.
   * @returns A randomly generated session ID string.
   * @example
   * const sessionId = sdk.generateSessionId();
   */
  private generateSessionId(): string {
    return Math.random().toString(36).substr(2, 9);
  }
}
