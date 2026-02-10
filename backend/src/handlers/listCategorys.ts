import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { logger } from "../lib/observability";
import { commonMiddleware } from "../lib/middleware";
import { DynamoCategoryRepository } from "../adapters/dynamo-category-repository";
import { EventBridgePublisher } from "../adapters/event-bridge-publisher";
import { CategoryService } from "../application/category-service";

const repository = new DynamoCategoryRepository();
const publisher = new EventBridgePublisher(process.env.EVENT_BUS_NAME || "");
const service = new CategoryService(repository, publisher);

const baseHandler = async (event: APIGatewayProxyEvent, context: any): Promise<APIGatewayProxyResult> => {
    logger.addContext(context);

    const limit = event.queryStringParameters?.limit
        ? parseInt(event.queryStringParameters.limit, 10)
        : undefined;
    const cursor = event.queryStringParameters?.cursor || undefined;

    const result = await service.listCategories({ limit, cursor });

    return {
        statusCode: 200,
        body: JSON.stringify(result),
    };
};

export const handler = commonMiddleware(baseHandler);
