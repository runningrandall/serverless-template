import { vi, describe, it, expect, beforeEach } from 'vitest';
import { handler } from '../../src/handlers/getItem';
import { ItemEntity } from '../../src/entities/item';

// Mock electrodb Entity
vi.mock('../../src/entities/item', () => ({
    ItemEntity: {
        get: vi.fn(),
    },
}));

const makeEvent = (overrides: Record<string, any> = {}) => ({
    headers: { 'Content-Type': 'application/json' },
    body: null,
    pathParameters: null,
    queryStringParameters: null,
    multiValueHeaders: {},
    multiValueQueryStringParameters: null,
    httpMethod: 'GET',
    isBase64Encoded: false,
    path: '/items',
    stageVariables: null,
    requestContext: {} as any,
    resource: '',
    ...overrides,
});

describe('getItem handler', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should get an item successfully', async () => {
        const mockItem = { itemId: '123', name: 'Test Item', description: 'desc' };

        const mockGo = vi.fn().mockResolvedValue({ data: mockItem });
        (ItemEntity.get as any).mockReturnValue({ go: mockGo });

        const event = makeEvent({
            pathParameters: { itemId: '123' },
        });

        const result = await handler(event, {} as any, {} as any);

        expect(result).toMatchObject({
            statusCode: 200,
            body: JSON.stringify(mockItem),
        });
        expect(ItemEntity.get).toHaveBeenCalledWith({ itemId: '123' });
    });

    it('should return 400 if itemId is missing', async () => {
        const event = makeEvent({
            pathParameters: {},
        });

        const result = await handler(event, {} as any, {} as any);

        expect(result.statusCode).toBe(400);
    });

    it('should return 404 if item not found', async () => {
        const mockGo = vi.fn().mockResolvedValue({ data: null });
        (ItemEntity.get as any).mockReturnValue({ go: mockGo });

        const event = makeEvent({
            pathParameters: { itemId: '404' },
        });

        const result = await handler(event, {} as any, {} as any);

        expect(result.statusCode).toBe(404);
    });

    it('should return 500 on error', async () => {
        const errorMsg = 'DB Error';
        const mockGo = vi.fn().mockRejectedValue(new Error(errorMsg));
        (ItemEntity.get as any).mockReturnValue({ go: mockGo });

        const event = makeEvent({
            pathParameters: { itemId: '123' },
        });

        const result = await handler(event, {} as any, {} as any);

        expect(result.statusCode).toBe(500);
    });
});
