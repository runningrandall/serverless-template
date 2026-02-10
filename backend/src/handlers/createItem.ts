import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { ItemEntity } from "../entities/item";
import { EventBridgeClient, PutEventsCommand } from "@aws-sdk/client-eventbridge";
import { logger, tracer, metrics } from "../lib/observability";
import { MetricUnit } from "@aws-lambda-powertools/metrics";
import { CreateItemSchema } from "../lib/schemas";
import { randomUUID } from "crypto";
import { commonMiddleware } from "../lib/middleware";
import { AppError } from "../lib/error";

const eventBridge = tracer.captureAWSv3Client(new EventBridgeClient({}));

const baseHandler = async (event: APIGatewayProxyEvent, context: any): Promise<APIGatewayProxyResult> => {
    const EVENT_BUS_NAME = process.env.EVENT_BUS_NAME;

    // Add context to logger
    logger.addContext(context);

    // Body is already parsed by middleware
    const body = event.body as unknown as any;

    if (!body) {
        throw new AppError("Missing body", 400);
    }

    const parseResult = CreateItemSchema.safeParse(body);

    if (!parseResult.success) {
        const issues = parseResult.error.issues;
        logger.warn("Validation failed", { issues });
        metrics.addMetric('ValidationErrors', MetricUnit.Count, 1);
        return {
            statusCode: 400,
            body: JSON.stringify({
                error: "Validation failed",
                details: issues
            })
        };
    }

    const validatedBody = parseResult.data;
    const itemId = randomUUID();
    logger.info("Creating item", { itemName: validatedBody.name, itemId });

    const itemToCreate = {
        ...validatedBody,
        itemId,
    };

    const result = await ItemEntity.create(itemToCreate).go();
    logger.info("Item created successfully", { itemId: result.data.itemId });
    metrics.addMetric('ItemsCreated', MetricUnit.Count, 1);

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
            logger.info("Published ItemCreated event");
        } catch (err) {
            logger.error("Failed to publish event", { error: err });
            metrics.addMetric('EventPublishErrors', MetricUnit.Count, 1);
        }
    }

    return {
        statusCode: 201,
        body: JSON.stringify(result.data),
    };
};

export const handler = commonMiddleware(baseHandler);

