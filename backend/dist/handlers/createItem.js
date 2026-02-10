"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;
const item_1 = require("../entities/item");
const client_eventbridge_1 = require("@aws-sdk/client-eventbridge");
const observability_1 = require("../lib/observability");
const schemas_1 = require("../lib/schemas");
const crypto_1 = require("crypto");
const eventBridge = observability_1.tracer.captureAWSv3Client(new client_eventbridge_1.EventBridgeClient({}));
const handler = async (event, context) => {
    const EVENT_BUS_NAME = process.env.EVENT_BUS_NAME;
    // Add context to logger
    observability_1.logger.addContext(context);
    try {
        if (!event.body) {
            observability_1.logger.warn("Missing body in request");
            return { statusCode: 400, body: JSON.stringify({ error: "Missing body" }) };
        }
        const parseResult = schemas_1.CreateItemSchema.safeParse(JSON.parse(event.body));
        if (!parseResult.success) {
            const issues = parseResult.error.issues;
            observability_1.logger.warn("Validation failed", { issues });
            return {
                statusCode: 400,
                body: JSON.stringify({
                    error: "Validation failed",
                    details: issues
                })
            };
        }
        const body = parseResult.data;
        const itemId = (0, crypto_1.randomUUID)();
        observability_1.logger.info("Creating item", { itemName: body.name, itemId });
        const itemToCreate = {
            ...body,
            itemId,
        };
        const result = await item_1.ItemEntity.create(itemToCreate).go();
        observability_1.logger.info("Item created successfully", { itemId: result.data.itemId });
        // Publish Event
        if (EVENT_BUS_NAME) {
            try {
                await eventBridge.send(new client_eventbridge_1.PutEventsCommand({
                    Entries: [{
                        Source: "test.api",
                        DetailType: "ItemCreated",
                        Detail: JSON.stringify(result.data),
                        EventBusName: EVENT_BUS_NAME,
                    }]
                }));
                observability_1.logger.info("Published ItemCreated event");
            }
            catch (err) {
                observability_1.logger.error("Failed to publish event", { error: err });
                // Don't fail the request if event publishing fails, but log it
            }
        }
        return {
            statusCode: 201,
            headers: { "Access-Control-Allow-Origin": "*" },
            body: JSON.stringify(result.data),
        };
    }
    catch (error) {
        observability_1.logger.error("Error creating item", { error });
        return {
            statusCode: 500,
            headers: { "Access-Control-Allow-Origin": "*" },
            body: JSON.stringify({ error: error.message }),
        };
    }
};
exports.handler = handler;
