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
export declare class SkopeLinkSdk {
    /** SDK configuration settings. */
    private config;
    /** Queue to store events before sending. */
    private eventQueue;
    /** Indicates if a flush operation is in progress. */
    private isFlushing;
    /**
     * Initializes the SDK with the provided configuration.
     * @param config - The configuration object for the SDK.
     * @throws Error if `apiKey` or `endpoint` is missing.
     */
    init(config: SDKConfig): void;
    /**
     * Tracks an event by adding it to the queue. Sends the queue if it reaches the batch size.
     * @param eventName - The name of the event to track.
     * @param eventData - Additional data related to the event.
     * @returns void
     * @example
     * sdk.track('user_signup', { plan: 'premium' });
     */
    track(eventName: string, eventData: Record<string, any>): void;
    /**
     * Sends all queued events to the analytics endpoint.
     * @returns A promise that resolves when the flush operation completes.
     * @example
     * await sdk.flush();
     */
    flush(): Promise<void>;
    /**
     * Generates a unique session ID for tracking events.
     * @returns A randomly generated session ID string.
     * @example
     * const sessionId = sdk.generateSessionId();
     */
    private generateSessionId;
}
export {};
