"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CategoryService = void 0;
const crypto_1 = require("crypto");
const observability_1 = require("../lib/observability");
const metrics_1 = require("@aws-lambda-powertools/metrics");
const error_1 = require("../lib/error");
class CategoryService {
    repository;
    eventPublisher;
    constructor(repository, eventPublisher) {
        this.repository = repository;
        this.eventPublisher = eventPublisher;
    }
    async createCategory(request) {
        observability_1.logger.info("Creating category", { name: request.name });
        const category = {
            categoryId: (0, crypto_1.randomUUID)(),
            name: request.name,
            description: request.description,
        };
        const created = await this.repository.create(category);
        observability_1.metrics.addMetric('CategoriesCreated', metrics_1.MetricUnit.Count, 1);
        await this.eventPublisher.publish("CategoryCreated", created);
        return created;
    }
    async getCategory(categoryId) {
        const category = await this.repository.get(categoryId);
        if (!category) {
            throw new error_1.AppError("Category not found", 404);
        }
        return category;
    }
    async listCategories(options) {
        return this.repository.list(options);
    }
    async deleteCategory(categoryId) {
        await this.repository.delete(categoryId);
        observability_1.logger.info("Category deleted", { categoryId });
    }
}
exports.CategoryService = CategoryService;
