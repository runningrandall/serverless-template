/**
 * Integration tests for ItemService + DynamoItemRepository against local DynamoDB.
 *
 * Prerequisites:
 *   1. DynamoDB Local running: pnpm db:start
 *   2. Run: pnpm --filter backend test:integration
 */
import { describe, it, expect, vi, beforeAll } from "vitest";
import { setupDynamoTestTable } from "./setup";

// Set env vars BEFORE any imports that use them
setupDynamoTestTable();

// Dynamic imports so env vars are set before modules are loaded
let ItemService: any;
let DynamoItemRepository: any;

beforeAll(async () => {
    const serviceModule = await import("../../src/application/item-service");
    const repoModule = await import("../../src/adapters/dynamo-item-repository");
    ItemService = serviceModule.ItemService;
    DynamoItemRepository = repoModule.DynamoItemRepository;
});

// Stub event publisher (we don't want to hit real EventBridge)
const mockPublisher = {
    publish: vi.fn().mockResolvedValue(undefined),
};

describe("ItemService Integration Tests", () => {
    it("should create an item and retrieve it by ID", async () => {
        const repo = new DynamoItemRepository();
        const service = new ItemService(repo, mockPublisher);

        const created = await service.createItem({
            name: "Integration Test Item",
            description: "Created by integration test",
        });

        expect(created).toBeDefined();
        expect(created.itemId).toBeDefined();
        expect(created.name).toBe("Integration Test Item");

        // Retrieve it
        const fetched = await service.getItem(created.itemId);
        expect(fetched.itemId).toBe(created.itemId);
        expect(fetched.name).toBe("Integration Test Item");
    });

    it("should list items", async () => {
        const repo = new DynamoItemRepository();
        const service = new ItemService(repo, mockPublisher);

        // Create a couple of items
        await service.createItem({ name: "List Item A" });
        await service.createItem({ name: "List Item B" });

        const items = await service.listItems();
        // Should have at least the 2 we just created (plus any from previous test)
        expect(items.length).toBeGreaterThanOrEqual(2);
        const names = items.map((i: any) => i.name);
        expect(names).toContain("List Item A");
        expect(names).toContain("List Item B");
    });

    it("should delete an item", async () => {
        const repo = new DynamoItemRepository();
        const service = new ItemService(repo, mockPublisher);

        const created = await service.createItem({
            name: "To Be Deleted",
        });

        // Delete it
        await service.deleteItem(created.itemId);

        // Attempting to get it should throw 404
        await expect(service.getItem(created.itemId)).rejects.toThrow("Item not found");
    });

    it("should throw 404 for a non-existent item", async () => {
        const repo = new DynamoItemRepository();
        const service = new ItemService(repo, mockPublisher);

        await expect(service.getItem("non-existent-id")).rejects.toThrow("Item not found");
    });

    it("should publish an event when creating an item", async () => {
        const repo = new DynamoItemRepository();
        const publisher = { publish: vi.fn().mockResolvedValue(undefined) };
        const service = new ItemService(repo, publisher);

        const created = await service.createItem({ name: "Event Test" });

        expect(publisher.publish).toHaveBeenCalledTimes(1);
        expect(publisher.publish).toHaveBeenCalledWith("ItemCreated", expect.objectContaining({
            itemId: created.itemId,
            name: "Event Test",
        }));
    });
});
