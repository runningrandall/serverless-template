import { ItemRepository, Item, PaginationOptions, PaginatedResult } from "../domain/item";
import { DBService } from "../entities/service";
import { z } from "zod";
import { logger } from "../lib/observability";

/**
 * Zod schema for validating data coming OUT of DynamoDB.
 * This catches data corruption or schema drift at the adapter boundary.
 * Note: ElectroDB stores createdAt/updatedAt as numbers, so we coerce to string.
 */
const DynamoItemSchema = z.object({
    itemId: z.string(),
    name: z.string(),
    description: z.string().optional().nullable(),
    createdAt: z.union([z.string(), z.number()]).transform(v => String(v)),
    updatedAt: z.union([z.string(), z.number()]).optional().transform(v => v != null ? String(v) : undefined),
}).passthrough();

function parseItem(data: unknown): Item {
    const result = DynamoItemSchema.safeParse(data);
    if (!result.success) {
        logger.error("Data validation failed reading from DynamoDB", {
            errors: result.error.issues,
            data,
        });
        throw new Error(`Data integrity error: ${result.error.message}`);
    }
    return result.data as Item;
}

const DEFAULT_PAGE_SIZE = 20;

export class DynamoItemRepository implements ItemRepository {
    async create(item: Item): Promise<Item> {
        const result = await DBService.entities.item.create(item).go();
        return parseItem(result.data);
    }

    async get(itemId: string): Promise<Item | null> {
        const result = await DBService.entities.item.get({ itemId }).go();
        if (!result.data) return null;
        return parseItem(result.data);
    }

    async list(options?: PaginationOptions): Promise<PaginatedResult<Item>> {
        const limit = options?.limit || DEFAULT_PAGE_SIZE;

        const result = await DBService.entities.item.scan.go({
            limit,
            ...(options?.cursor && { cursor: options.cursor }),
        });

        return {
            items: result.data.map(parseItem),
            cursor: result.cursor ?? null,
        };
    }

    async delete(itemId: string): Promise<void> {
        await DBService.entities.item.delete({ itemId }).go();
    }
}
