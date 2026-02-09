import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { handler } from '../../src/handlers/createItem';
import { ItemEntity } from '../../src/entities/item';

// Mock electrodb Entity
vi.mock('../../src/entities/item', () => ({
    ItemEntity: {
        create: vi.fn(),
    },
}));

// Mock EventBridge Client
const mockSend = vi.fn();
vi.mock('@aws-sdk/client-eventbridge', () => ({
    EventBridgeClient: vi.fn(() => ({
        send: mockSend,
    })),
    PutEventsCommand: vi.fn(),
}));

describe('createItem handler', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        // Default: env var not set
        delete process.env.EVENT_BUS_NAME;
    });

    afterEach(() => {
        delete process.env.EVENT_BUS_NAME;
    });

    it('should create an item successfully (no event published if env not set)', async () => {
        const mockItem = { itemId: '123', name: 'Test Item', description: 'desc' };

        // Mock chainable .go() method
        const mockGo = vi.fn().mockResolvedValue({ data: mockItem });
        (ItemEntity.create as any).mockReturnValue({ go: mockGo });

        const event = {
            body: JSON.stringify({ name: 'Test Item', description: 'desc' }),
        } as any;

        const result = await handler(event, {} as any, {} as any);

        expect(result).toMatchObject({
            statusCode: 201,
            body: JSON.stringify(mockItem),
        });
        expect(ItemEntity.create).toHaveBeenCalledWith({ name: 'Test Item', description: 'desc' });
        expect(mockSend).not.toHaveBeenCalled();
    });

    it('should create an item and publish event when env var is set', async () => {
        process.env.EVENT_BUS_NAME = 'test-bus';
        const mockItem = { itemId: '123', name: 'Test Item', description: 'desc' };

        const mockGo = vi.fn().mockResolvedValue({ data: mockItem });
        (ItemEntity.create as any).mockReturnValue({ go: mockGo });

        const event = {
            body: JSON.stringify({ name: 'Test Item', description: 'desc' }),
        } as any;

        await handler(event, {} as any, {} as any);

        expect(mockSend).toHaveBeenCalledTimes(1);
        expect(mockSend).toHaveBeenCalledWith(expect.any(Object));
    });

    it('should return 400 if body is missing', async () => {
        const event = {} as any;
        const result = await handler(event, {} as any, {} as any);

        expect(result).toMatchObject({
            statusCode: 400,
            body: JSON.stringify({ error: 'Missing body' }),
        });
    });

    it('should return 500 on error', async () => {
        const errorMsg = 'DB Error';
        const mockGo = vi.fn().mockRejectedValue(new Error(errorMsg));
        (ItemEntity.create as any).mockReturnValue({ go: mockGo });

        const event = {
            body: JSON.stringify({ name: 'Fail' }),
        } as any;

        const result = await handler(event, {} as any, {} as any);

        expect(result).toMatchObject({
            statusCode: 500,
            body: JSON.stringify({ error: errorMsg }),
        });
    });
});
