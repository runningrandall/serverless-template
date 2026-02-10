import { Category, CreateCategoryRequest, CategoryRepository } from "../domain/category";
import { EventPublisher, PaginationOptions, PaginatedResult } from "../domain/item";
import { randomUUID } from "crypto";
import { logger, metrics } from "../lib/observability";
import { MetricUnit } from "@aws-lambda-powertools/metrics";
import { AppError } from "../lib/error";

export class CategoryService {
    constructor(
        private repository: CategoryRepository,
        private eventPublisher: EventPublisher
    ) { }

    async createCategory(request: CreateCategoryRequest): Promise<Category> {
        logger.info("Creating category", { name: request.name });

        const category = {
            categoryId: randomUUID(),
            name: request.name,
            description: request.description,
        };

        const created = await this.repository.create(category as Category);
        metrics.addMetric('CategoriesCreated', MetricUnit.Count, 1);

        await this.eventPublisher.publish("CategoryCreated", created);

        return created;
    }

    async getCategory(categoryId: string): Promise<Category> {
        const category = await this.repository.get(categoryId);
        if (!category) {
            throw new AppError("Category not found", 404);
        }
        return category;
    }

    async listCategories(options?: PaginationOptions): Promise<PaginatedResult<Category>> {
        return this.repository.list(options);
    }

    async deleteCategory(categoryId: string): Promise<void> {
        await this.repository.delete(categoryId);
        logger.info("Category deleted", { categoryId });
    }
}
