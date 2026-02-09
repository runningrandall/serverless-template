import { APIGatewayProxyHandler } from "aws-lambda";
import { ItemEntity } from "../entities/item";
import { EventBridgeClient, PutEventsCommand } from "@aws-sdk/client-eventbridge";

const eventBridge = new EventBridgeClient({});
const EVENT_BUS_NAME = process.env.EVENT_BUS_NAME;

export const handler: APIGatewayProxyHandler = async (event) => {
    try {
        if (!event.body) {
            return { statusCode: 400, body: JSON.stringify({ error: "Missing body" }) };
        }

        const body = JSON.parse(event.body);
        const result = await ItemEntity.create(body).go();

        // Publish Event
        if (EVENT_BUS_NAME) {
            try {
                await eventBridge.send(new PutEventsCommand({
                    Entries: [{
                        Source: "hmaas.api",
                        DetailType: "ItemCreated",
                        Detail: JSON.stringify(result.data),
                        EventBusName: EVENT_BUS_NAME,
                    }]
                }));
                console.log("Published ItemCreated event");
            } catch (err) {
                console.error("Failed to publish event:", err);
                // Don't fail the request if event publishing fails, but log it
            }
        }

        return {
            statusCode: 201,
            headers: { "Access-Control-Allow-Origin": "*" },
            body: JSON.stringify(result.data),
        };
    } catch (error: any) {
        console.error(error);
        return {
            statusCode: 500,
            headers: { "Access-Control-Allow-Origin": "*" },
            body: JSON.stringify({ error: error.message }),
        };
    }
};
