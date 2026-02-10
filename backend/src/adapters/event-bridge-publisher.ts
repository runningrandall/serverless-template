import { EventPublisher } from "../domain/item";
import { EventBridgeClient, PutEventsCommand } from "@aws-sdk/client-eventbridge";
import { tracer, logger } from "../lib/observability";

export class EventBridgePublisher implements EventPublisher {
    private client: EventBridgeClient;
    private busName: string;

    constructor(busName: string) {
        this.client = tracer.captureAWSv3Client(new EventBridgeClient({}));
        this.busName = busName;
    }

    async publish(eventName: string, payload: any): Promise<void> {
        if (!this.busName) {
            logger.warn("EventBusName not provided, skipping event publication", { eventName });
            return;
        }

        try {
            await this.client.send(new PutEventsCommand({
                Entries: [{
                    Source: "hmaas.api",
                    DetailType: eventName,
                    Detail: JSON.stringify(payload),
                    EventBusName: this.busName,
                }]
            }));
            logger.info(`Published ${eventName} event`, { busName: this.busName });
        } catch (error) {
            logger.error(`Failed to publish ${eventName} event`, { error });
            // We consciously ensure that event publishing failure doesn't fail the main request, 
            // but we log it. Depending on requirements, we might want to throw here.
        }
    }
}
