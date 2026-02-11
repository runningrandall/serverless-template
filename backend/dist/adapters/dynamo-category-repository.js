"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DynamoCategoryRepository = void 0;
const service_1 = require("../entities/service");
const zod_1 = require("zod");
const observability_1 = require("../lib/observability");
const DynamoCategorySchema = zod_1.z.object({
    categoryId: zod_1.z.string(),
    name: zod_1.z.string(),
    description: zod_1.z.string().optional().nullable(),
    createdAt: zod_1.z.union([zod_1.z.string(), zod_1.z.number()]).transform(v => String(v)),
    updatedAt: zod_1.z.union([zod_1.z.string(), zod_1.z.number()]).optional().transform(v => v != null ? String(v) : undefined),
}).passthrough();
function parseCategory(data) {
    const result = DynamoCategorySchema.safeParse(data);
    if (!result.success) {
        observability_1.logger.error("Data validation failed reading from DynamoDB", {
            errors: result.error.issues,
            data,
        });
        throw new Error(`Data integrity error: ${result.error.message}`);
    }
    return result.data;
}
const DEFAULT_PAGE_SIZE = 20;
class DynamoCategoryRepository {
    async create(category) {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { createdAt, ...data } = category;
        const result = await service_1.DBService.entities.category.create(data).go();
        return parseCategory(result.data);
    }
    async get(categoryId) {
        const result = await service_1.DBService.entities.category.get({ categoryId }).go();
        if (!result.data)
            return null;
        return parseCategory(result.data);
    }
    async list(options) {
        const limit = options?.limit || DEFAULT_PAGE_SIZE;
        const result = await service_1.DBService.entities.category.scan.go({
            limit,
            ...(options?.cursor && { cursor: options.cursor }),
        });
        return {
            items: result.data.map(parseCategory),
            cursor: result.cursor ?? null,
        };
    }
    async delete(categoryId) {
        await service_1.DBService.entities.category.delete({ categoryId }).go();
    }
}
exports.DynamoCategoryRepository = DynamoCategoryRepository;
