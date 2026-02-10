import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { logger, metrics } from "../lib/observability";
import { MetricUnit } from "@aws-lambda-powertools/metrics";
import { CreateCategorySchema } from "../lib/category-schemas";
import { commonMiddleware } from "../lib/middleware";
import { AppError } from "../lib/error";
import { DynamoCategoryRepository } from "../adapters/dynamo-category-repository";
import { EventBridgePublisher } from "../adapters/event-bridge-publisher";
import { CategoryService } from "../application/category-service";

const repository = new DynamoCategoryRepository();
const publisher = new EventBridgePublisher(process.env.EVENT_BUS_NAME || "");
const service = new CategoryService(repository, publisher);

const baseHandler = async (event: APIGatewayProxyEvent, context: any): Promise<APIGatewayProxyResult> => {
    logger.addContext(context);

    const body = event.body as unknown as any;

    if (!body) {
        throw new AppError("Missing request body", 400);
    }

    const parseResult = CreateCategorySchema.safeParse(body);

    if (!parseResult.success) {
        logger.warn("Validation failed", { issues: parseResult.error.issues });
        metrics.addMetric('ValidationErrors', MetricUnit.Count, 1);
        throw parseResult.error;
    }

    const result = await service.createCategory(parseResult.data);

    return {
        statusCode: 201,
        body: JSON.stringify(result),
    };
};

export const handler = commonMiddleware(baseHandler);
