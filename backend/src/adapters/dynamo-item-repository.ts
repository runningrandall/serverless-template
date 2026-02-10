import { ItemRepository, Item } from "../domain/item";
import { ItemEntity } from "../entities/item";
import { logger } from "../lib/observability";

export class DynamoItemRepository implements ItemRepository {
    async create(item: Item): Promise<Item> {
        const result = await ItemEntity.create(item).go();
        return result.data as Item;
    }

    async get(itemId: string): Promise<Item | null> {
        const result = await ItemEntity.get({ itemId }).go();
        return result.data as Item | null;
    }

    async list(): Promise<Item[]> {
        const result = await ItemEntity.scan.go();
        return result.data as Item[];
    }

    async delete(itemId: string): Promise<void> {
        await ItemEntity.delete({ itemId }).go();
    }
}
