"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SkopeLinkSdk = void 0;
/**
 * SkopeLink SDK for tracking analytics events.
 */
class SkopeLinkSdk {
    constructor() {
        /** Queue to store events before sending. */
        this.eventQueue = [];
        /** Indicates if a flush operation is in progress. */
        this.isFlushing = false;
    }
    /**
     * Initializes the SDK with the provided configuration.
     * @param config - The configuration object for the SDK.
     * @throws Error if `apiKey` or `endpoint` is missing.
     */
    init(config) {
        if (!config.apiKey || !config.endpoint) {
            throw new Error('API Key and Endpoint are required for initialization.');
        }
        this.config = Object.assign(Object.assign({}, config), { batchSize: config.batchSize || 10, retryAttempts: config.retryAttempts || 3 });
    }
    /**
     * Tracks an event by adding it to the queue. Sends the queue if it reaches the batch size.
     * @param eventName - The name of the event to track.
     * @param eventData - Additional data related to the event.
     * @returns void
     * @example
     * sdk.track('user_signup', { plan: 'premium' });
     */
    track(eventName, eventData) {
        if (!this.config) {
            console.warn('SDK not initialized. Call init() before tracking events.');
            return;
        }
        const event = {
            event_name: eventName,
            event_properties: Object.assign(Object.assign({}, eventData), { userId: this.config.userId }),
            session_id: this.generateSessionId(),
            source: 'sdk', // Adjust as needed
        };
        this.eventQueue.push(event);
        if (this.config.batchSize &&
            this.eventQueue.length >= this.config.batchSize) {
            this.flush();
        }
    }
    /**
     * Sends all queued events to the analytics endpoint.
     * @returns A promise that resolves when the flush operation completes.
     * @example
     * await sdk.flush();
     */
    flush() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.isFlushing || this.eventQueue.length === 0) {
                return;
            }
            this.isFlushing = true;
            const eventsToSend = [...this.eventQueue];
            this.eventQueue = [];
            try {
                const response = yield fetch(`${this.config.endpoint}/analytics/track`, {
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
            }
            catch (error) {
                console.error('Error sending events, requeuing:', error);
                this.eventQueue = [...eventsToSend, ...this.eventQueue];
            }
            finally {
                this.isFlushing = false;
            }
        });
    }
    /**
     * Generates a unique session ID for tracking events.
     * @returns A randomly generated session ID string.
     * @example
     * const sessionId = sdk.generateSessionId();
     */
    generateSessionId() {
        return Math.random().toString(36).substr(2, 9);
    }
}
exports.SkopeLinkSdk = SkopeLinkSdk;
