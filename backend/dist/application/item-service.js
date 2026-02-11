"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ItemService = void 0;
const crypto_1 = require("crypto");
const observability_1 = require("../lib/observability");
const metrics_1 = require("@aws-lambda-powertools/metrics");
const error_1 = require("../lib/error");
class ItemService {
    repository;
    eventPublisher;
    constructor(repository, eventPublisher) {
        this.repository = repository;
        this.eventPublisher = eventPublisher;
    }
    async createItem(request) {
        observability_1.logger.info("Creating item", { name: request.name });
        const item = {
            itemId: (0, crypto_1.randomUUID)(),
            name: request.name,
            description: request.description,
            createdAt: new Date().toISOString(),
        };
        const createdItem = await this.repository.create(item);
        observability_1.metrics.addMetric('ItemsCreated', metrics_1.MetricUnit.Count, 1);
        await this.eventPublisher.publish("ItemCreated", createdItem);
        return createdItem;
    }
    async getItem(itemId) {
        const item = await this.repository.get(itemId);
        if (!item) {
            throw new error_1.AppError("Item not found", 404);
        }
        return item;
    }
    async listItems(options) {
        return this.repository.list(options);
    }
    async deleteItem(itemId) {
        // Build Check: Ensure item exists before deleting? 
        // For now, simpler delete logic usually acceptable for DynamoDB.
        await this.repository.delete(itemId);
        observability_1.logger.info("Item deleted", { itemId });
    }
}
exports.ItemService = ItemService;
