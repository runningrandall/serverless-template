import { ItemRepository, Item } from "../domain/item";
import { DBService } from "../entities/service";

export class DynamoItemRepository implements ItemRepository {
    async create(item: Item): Promise<Item> {
        const result = await DBService.entities.item.create(item).go();
        return result.data as Item;
    }

    async get(itemId: string): Promise<Item | null> {
        const result = await DBService.entities.item.get({ itemId }).go();
        return result.data as Item | null;
    }

    async list(): Promise<Item[]> {
        const result = await DBService.entities.item.scan.go();
        return result.data as Item[];
    }

    async delete(itemId: string): Promise<void> {
        await DBService.entities.item.delete({ itemId }).go();
    }
}
