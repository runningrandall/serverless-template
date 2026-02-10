import { Item, CreateItemRequest, ItemRepository, EventPublisher } from "../domain/item";
import { randomUUID } from "crypto";
import { logger, metrics } from "../lib/observability";
import { MetricUnit } from "@aws-lambda-powertools/metrics";
import { AppError } from "../lib/error";

export class ItemService {
    constructor(
        private repository: ItemRepository,
        private eventPublisher: EventPublisher
    ) { }

    async createItem(request: CreateItemRequest): Promise<Item> {
        logger.info("Creating item", { name: request.name });

        const item: Item = {
            itemId: randomUUID(),
            name: request.name,
            description: request.description,
            createdAt: new Date().toISOString(),
        };

        const createdItem = await this.repository.create(item);
        metrics.addMetric('ItemsCreated', MetricUnit.Count, 1);

        await this.eventPublisher.publish("ItemCreated", createdItem);

        return createdItem;
    }

    async getItem(itemId: string): Promise<Item> {
        const item = await this.repository.get(itemId);
        if (!item) {
            throw new AppError("Item not found", 404);
        }
        return item;
    }

    async listItems(): Promise<Item[]> {
        return this.repository.list();
    }

    async deleteItem(itemId: string): Promise<void> {
        // Build Check: Ensure item exists before deleting? 
        // For now, simpler delete logic usually acceptable for DynamoDB.
        await this.repository.delete(itemId);
        logger.info("Item deleted", { itemId });
    }
}
