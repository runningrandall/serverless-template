import { vi, describe, it, expect, beforeEach } from 'vitest';
import { handler } from '../../src/handlers/deleteItem';
import { ItemEntity } from '../../src/entities/item';

vi.mock('../../src/entities/item', () => ({
    ItemEntity: {
        delete: vi.fn(),
    },
}));

const makeEvent = (overrides: Record<string, any> = {}) => ({
    headers: { 'Content-Type': 'application/json' },
    body: null,
    pathParameters: null,
    queryStringParameters: null,
    multiValueHeaders: {},
    multiValueQueryStringParameters: null,
    httpMethod: 'DELETE',
    isBase64Encoded: false,
    path: '/items',
    stageVariables: null,
    requestContext: {} as any,
    resource: '',
    ...overrides,
});

describe('deleteItem handler', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should delete an item successfully', async () => {
        const mockGo = vi.fn().mockResolvedValue({});
        (ItemEntity.delete as any).mockReturnValue({ go: mockGo });

        const event = makeEvent({
            pathParameters: { itemId: '123' },
        });

        const result = await handler(event, {} as any, {} as any);

        expect(result).toMatchObject({
            statusCode: 200,
            body: JSON.stringify({ message: 'Item deleted' }),
        });
        expect(ItemEntity.delete).toHaveBeenCalledWith({ itemId: '123' });
    });

    it('should return 400 if itemId is missing', async () => {
        const event = makeEvent({
            pathParameters: {},
        });

        const result = await handler(event, {} as any, {} as any);

        expect(result.statusCode).toBe(400);
    });

    it('should return 400 if pathParameters is null', async () => {
        const event = makeEvent({
            pathParameters: null,
        });

        const result = await handler(event, {} as any, {} as any);

        expect(result.statusCode).toBe(400);
    });

    it('should return 500 on error', async () => {
        const mockGo = vi.fn().mockRejectedValue(new Error('DB Error'));
        (ItemEntity.delete as any).mockReturnValue({ go: mockGo });

        const event = makeEvent({
            pathParameters: { itemId: '123' },
        });

        const result = await handler(event, {} as any, {} as any);

        expect(result.statusCode).toBe(500);
    });
});
