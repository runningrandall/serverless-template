import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { ItemEntity } from "../entities/item";
import { logger } from "../lib/observability";
import { commonMiddleware } from "../lib/middleware";
import { AppError } from "../lib/error";

const baseHandler = async (event: APIGatewayProxyEvent, context: any): Promise<APIGatewayProxyResult> => {
    logger.addContext(context);

    const itemId = event.pathParameters?.itemId;
    if (!itemId) {
        throw new AppError("Missing itemId", 400);
    }

    const result = await ItemEntity.get({ itemId }).go();

    if (!result.data) {
        throw new AppError("Item not found", 404);
    }

    return {
        statusCode: 200,
        body: JSON.stringify(result.data),
    };
};

export const handler = commonMiddleware(baseHandler);
