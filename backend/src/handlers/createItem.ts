import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { logger, metrics } from "../lib/observability";
import { MetricUnit } from "@aws-lambda-powertools/metrics";
import { CreateItemSchema } from "../lib/schemas";
import { commonMiddleware } from "../lib/middleware";
import { AppError } from "../lib/error";
import { DynamoItemRepository } from "../adapters/dynamo-item-repository";
import { EventBridgePublisher } from "../adapters/event-bridge-publisher";
import { ItemService } from "../application/item-service";

// Composition Root (Dependency Injection)
const repository = new DynamoItemRepository();
const publisher = new EventBridgePublisher(process.env.EVENT_BUS_NAME || "");
const service = new ItemService(repository, publisher);

const baseHandler = async (event: APIGatewayProxyEvent, context: any): Promise<APIGatewayProxyResult> => {
    logger.addContext(context);

    const body = event.body as unknown as any;

    if (!body) {
        throw new AppError("Missing request body", 400);
    }

    // Throws ZodError on failure — caught by errorHandlerMiddleware
    const parseResult = CreateItemSchema.safeParse(body);

    if (!parseResult.success) {
        logger.warn("Validation failed", { issues: parseResult.error.issues });
        metrics.addMetric('ValidationErrors', MetricUnit.Count, 1);
        // Throw ZodError so the centralized error handler formats it consistently
        throw parseResult.error;
    }

    const result = await service.createItem(parseResult.data);

    return {
        statusCode: 201,
        body: JSON.stringify(result),
    };
};

export const handler = commonMiddleware(baseHandler);

