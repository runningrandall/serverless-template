"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;
const observability_1 = require("../lib/observability");
const middleware_1 = require("../lib/middleware");
const dynamo_item_repository_1 = require("../adapters/dynamo-item-repository");
const event_bridge_publisher_1 = require("../adapters/event-bridge-publisher");
const item_service_1 = require("../application/item-service");
const repository = new dynamo_item_repository_1.DynamoItemRepository();
const publisher = new event_bridge_publisher_1.EventBridgePublisher(process.env.EVENT_BUS_NAME || "");
const service = new item_service_1.ItemService(repository, publisher);
const baseHandler = async (event, context) => {
    observability_1.logger.addContext(context);
    const limit = event.queryStringParameters?.limit
        ? parseInt(event.queryStringParameters.limit, 10)
        : undefined;
    const cursor = event.queryStringParameters?.cursor || undefined;
    const result = await service.listItems({ limit, cursor });
    return {
        statusCode: 200,
        body: JSON.stringify(result),
    };
};
exports.handler = (0, middleware_1.commonMiddleware)(baseHandler);
