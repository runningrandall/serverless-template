"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EventBridgePublisher = void 0;
const client_eventbridge_1 = require("@aws-sdk/client-eventbridge");
const observability_1 = require("../lib/observability");
class EventBridgePublisher {
    client;
    busName;
    constructor(busName) {
        this.client = observability_1.tracer.captureAWSv3Client(new client_eventbridge_1.EventBridgeClient({}));
        this.busName = busName;
    }
    async publish(eventName, payload) {
        if (!this.busName) {
            observability_1.logger.warn("EventBusName not provided, skipping event publication", { eventName });
            return;
        }
        try {
            await this.client.send(new client_eventbridge_1.PutEventsCommand({
                Entries: [{
                        Source: 'test.api',
                        DetailType: eventName,
                        Detail: JSON.stringify(payload),
                        EventBusName: this.busName,
                    }]
            }));
            observability_1.logger.info(`Published ${eventName} event`, { busName: this.busName });
        }
        catch (error) {
            observability_1.logger.error(`Failed to publish ${eventName} event`, { error });
            // We consciously ensure that event publishing failure doesn't fail the main request, 
            // but we log it. Depending on requirements, we might want to throw here.
        }
    }
}
exports.EventBridgePublisher = EventBridgePublisher;
