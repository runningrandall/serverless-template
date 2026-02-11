import { CategoryRepository, Category } from "../domain/category";
import { PaginationOptions, PaginatedResult } from "../domain/item";
import { DBService } from "../entities/service";
import { z } from "zod";
import { logger } from "../lib/observability";

const DynamoCategorySchema = z.object({
    categoryId: z.string(),
    name: z.string(),
    description: z.string().optional().nullable(),
    createdAt: z.union([z.string(), z.number()]).transform(v => String(v)),
    updatedAt: z.union([z.string(), z.number()]).optional().transform(v => v != null ? String(v) : undefined),
}).passthrough();

function parseCategory(data: unknown): Category {
    const result = DynamoCategorySchema.safeParse(data);
    if (!result.success) {
        logger.error("Data validation failed reading from DynamoDB", {
            errors: result.error.issues,
            data,
        });
        throw new Error(`Data integrity error: ${result.error.message}`);
    }
    return result.data as Category;
}

const DEFAULT_PAGE_SIZE = 20;

export class DynamoCategoryRepository implements CategoryRepository {
    async create(category: Category): Promise<Category> {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { createdAt, ...data } = category;
        const result = await DBService.entities.category.create(data).go();
        return parseCategory(result.data);
    }

    async get(categoryId: string): Promise<Category | null> {
        const result = await DBService.entities.category.get({ categoryId }).go();
        if (!result.data) return null;
        return parseCategory(result.data);
    }

    async list(options?: PaginationOptions): Promise<PaginatedResult<Category>> {
        const limit = options?.limit || DEFAULT_PAGE_SIZE;

        const result = await DBService.entities.category.scan.go({
            limit,
            ...(options?.cursor && { cursor: options.cursor }),
        });

        return {
            items: result.data.map(parseCategory),
            cursor: result.cursor ?? null,
        };
    }

    async delete(categoryId: string): Promise<void> {
        await DBService.entities.category.delete({ categoryId }).go();
    }
}
