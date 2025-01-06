type SDKConfig = {
  apiKey: string;
  endpoint: string;
  userId?: string;
  batchSize?: number;
  retryAttempts?: number;
};

export class SkopeLinkSdk {
  private config!: SDKConfig;
  private eventQueue: any[] = [];
  private isFlushing = false;

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

  track(eventName: string, eventData: Record<string, any>): void {
    if (!this.config) {
      console.warn('SDK not initialized. Call init() before tracking events.');
      return;
    }

    const event = {
      eventName,
      eventData,
      userId: this.config.userId,
      timestamp: new Date().toISOString(),
    };

    this.eventQueue.push(event);

    if (
      this.config.batchSize &&
      this.eventQueue.length >= this.config.batchSize
    ) {
      this.flush();
    }
  }

  async flush(): Promise<void> {
    if (this.isFlushing || this.eventQueue.length === 0) {
      return;
    }

    this.isFlushing = true;

    const eventsToSend = [...this.eventQueue];
    this.eventQueue = [];

    try {
      const response = await fetch(this.config.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.config.apiKey}`,
        },
        body: JSON.stringify({ events: eventsToSend }),
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
}
