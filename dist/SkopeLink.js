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
class SkopeLinkSdk {
    constructor() {
        this.eventQueue = [];
        this.isFlushing = false;
    }
    init(config) {
        if (!config.apiKey || !config.endpoint) {
            throw new Error('API Key and Endpoint are required for initialization.');
        }
        this.config = Object.assign(Object.assign({}, config), { batchSize: config.batchSize || 10, retryAttempts: config.retryAttempts || 3 });
    }
    track(eventName, eventData) {
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
        if (this.config.batchSize &&
            this.eventQueue.length >= this.config.batchSize) {
            this.flush();
        }
    }
    flush() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.isFlushing || this.eventQueue.length === 0) {
                return;
            }
            this.isFlushing = true;
            const eventsToSend = [...this.eventQueue];
            this.eventQueue = [];
            try {
                const response = yield fetch(this.config.endpoint, {
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
}
exports.SkopeLinkSdk = SkopeLinkSdk;
