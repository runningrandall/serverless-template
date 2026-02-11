"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DynamoItemRepository = void 0;
const service_1 = require("../entities/service");
const zod_1 = require("zod");
const observability_1 = require("../lib/observability");
/**
 * Zod schema for validating data coming OUT of DynamoDB.
 * This catches data corruption or schema drift at the adapter boundary.
 * Note: ElectroDB stores createdAt/updatedAt as numbers, so we coerce to string.
 */
const DynamoItemSchema = zod_1.z.object({
    itemId: zod_1.z.string(),
    name: zod_1.z.string(),
    description: zod_1.z.string().optional().nullable(),
    createdAt: zod_1.z.union([zod_1.z.string(), zod_1.z.number()]).transform(v => String(v)),
    updatedAt: zod_1.z.union([zod_1.z.string(), zod_1.z.number()]).optional().transform(v => v != null ? String(v) : undefined),
}).passthrough();
function parseItem(data) {
    const result = DynamoItemSchema.safeParse(data);
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
class DynamoItemRepository {
    async create(item) {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { createdAt, ...data } = item;
        const result = await service_1.DBService.entities.item.create(data).go();
        return parseItem(result.data);
    }
    async get(itemId) {
        const result = await service_1.DBService.entities.item.get({ itemId }).go();
        if (!result.data)
            return null;
        return parseItem(result.data);
    }
    async list(options) {
        const limit = options?.limit || DEFAULT_PAGE_SIZE;
        const result = await service_1.DBService.entities.item.scan.go({
            limit,
            ...(options?.cursor && { cursor: options.cursor }),
        });
        return {
            items: result.data.map(parseItem),
            cursor: result.cursor ?? null,
        };
    }
    async delete(itemId) {
        await service_1.DBService.entities.item.delete({ itemId }).go();
    }
}
exports.DynamoItemRepository = DynamoItemRepository;
