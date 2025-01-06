type SDKConfig = {
    apiKey: string;
    endpoint: string;
    userId?: string;
    batchSize?: number;
    retryAttempts?: number;
};
export declare class SkopeLinkSdk {
    private config;
    private eventQueue;
    private isFlushing;
    init(config: SDKConfig): void;
    track(eventName: string, eventData: Record<string, any>): void;
    flush(): Promise<void>;
    private generateSessionId;
}
export {};
