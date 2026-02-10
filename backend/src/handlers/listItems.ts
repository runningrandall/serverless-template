import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { logger } from "../lib/observability";
import { commonMiddleware } from "../lib/middleware";
import { DynamoItemRepository } from "../adapters/dynamo-item-repository";
import { EventBridgePublisher } from "../adapters/event-bridge-publisher";
import { ItemService } from "../application/item-service";

const repository = new DynamoItemRepository();
const publisher = new EventBridgePublisher(process.env.EVENT_BUS_NAME || "");
const service = new ItemService(repository, publisher);

const baseHandler = async (event: APIGatewayProxyEvent, context: any): Promise<APIGatewayProxyResult> => {
    logger.addContext(context);

    const result = await service.listItems();

    return {
        statusCode: 200,
        body: JSON.stringify(result),
    };
};

export const handler = commonMiddleware(baseHandler);
