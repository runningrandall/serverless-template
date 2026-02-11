"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;
const observability_1 = require("../lib/observability");
const metrics_1 = require("@aws-lambda-powertools/metrics");
const category_schemas_1 = require("../lib/category-schemas");
const middleware_1 = require("../lib/middleware");
const error_1 = require("../lib/error");
const dynamo_category_repository_1 = require("../adapters/dynamo-category-repository");
const event_bridge_publisher_1 = require("../adapters/event-bridge-publisher");
const category_service_1 = require("../application/category-service");
const repository = new dynamo_category_repository_1.DynamoCategoryRepository();
const publisher = new event_bridge_publisher_1.EventBridgePublisher(process.env.EVENT_BUS_NAME || "");
const service = new category_service_1.CategoryService(repository, publisher);
const baseHandler = async (event, context) => {
    observability_1.logger.addContext(context);
    const body = event.body;
    if (!body) {
        throw new error_1.AppError("Missing request body", 400);
    }
    const parseResult = category_schemas_1.CreateCategorySchema.safeParse(body);
    if (!parseResult.success) {
        observability_1.logger.warn("Validation failed", { issues: parseResult.error.issues });
        observability_1.metrics.addMetric('ValidationErrors', metrics_1.MetricUnit.Count, 1);
        throw parseResult.error;
    }
    const result = await service.createCategory(parseResult.data);
    return {
        statusCode: 201,
        body: JSON.stringify(result),
    };
};
exports.handler = (0, middleware_1.commonMiddleware)(baseHandler);
