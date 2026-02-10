import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { ItemEntity } from "../entities/item";
import { logger } from "../lib/observability";
import { commonMiddleware } from "../lib/middleware";

const baseHandler = async (event: APIGatewayProxyEvent, context: any): Promise<APIGatewayProxyResult> => {
    logger.addContext(context);

    const result = await ItemEntity.scan.go();

    return {
        statusCode: 200,
        body: JSON.stringify(result.data),
    };
};

export const handler = commonMiddleware(baseHandler);
