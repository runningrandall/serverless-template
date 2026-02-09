import { EventBridgeEvent } from "aws-lambda";

export const handler = async (event: EventBridgeEvent<string, any>) => {
    console.log("Received EventBridge Event:");
    console.log(JSON.stringify(event, null, 2));

    // Logic to process event
    if (event["detail-type"] === "ItemCreated") {
        console.log(`Processing ItemCreated event for item: ${event.detail.itemId}`);
    }

    return;
};
