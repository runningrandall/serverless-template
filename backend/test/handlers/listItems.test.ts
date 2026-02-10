import { vi, describe, it, expect, beforeEach } from 'vitest';
import { handler } from '../../src/handlers/listItems';
import { ItemService } from '../../src/application/item-service';

// Mock dependencies
vi.mock('../../src/adapters/dynamo-item-repository');
vi.mock('../../src/adapters/event-bridge-publisher');
vi.mock('../../src/application/item-service', () => ({
    ItemService: vi.fn().mockReturnValue({
        listItems: vi.fn(),
    }),
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

describe('listItems handler', () => {
    let mockListItems: any;

    beforeEach(() => {
        vi.clearAllMocks();
        // Get the mock instance
        const mockServiceInstance = new ItemService({} as any, {} as any);
        mockListItems = mockServiceInstance.listItems;
    });

    it('should list items successfully with pagination', async () => {
        const mockResult = {
            items: [
                { itemId: '1', name: 'Item 1', createdAt: '2023-01-01' },
                { itemId: '2', name: 'Item 2', createdAt: '2023-01-02' },
            ],
            cursor: null,
        };
        mockListItems.mockResolvedValue(mockResult);

        const event = makeEvent();
        const result = await handler(event, {} as any, {} as any);

        expect(result).toMatchObject({
            statusCode: 200,
            body: JSON.stringify(mockResult),
        });
        expect(mockListItems).toHaveBeenCalledWith({ limit: undefined, cursor: undefined });
    });

    it('should pass limit and cursor from query string', async () => {
        const mockResult = {
            items: [{ itemId: '1', name: 'Item 1', createdAt: '2023-01-01' }],
            cursor: 'next-page-cursor',
        };
        mockListItems.mockResolvedValue(mockResult);

        const event = makeEvent({
            queryStringParameters: { limit: '5', cursor: 'some-cursor' },
        });
        const result = await handler(event, {} as any, {} as any);

        expect(result).toMatchObject({
            statusCode: 200,
            body: JSON.stringify(mockResult),
        });
        expect(mockListItems).toHaveBeenCalledWith({ limit: 5, cursor: 'some-cursor' });
    });

    it('should return empty items with null cursor when no items exist', async () => {
        const mockResult = { items: [], cursor: null };
        mockListItems.mockResolvedValue(mockResult);

        const event = makeEvent();
        const result = await handler(event, {} as any, {} as any);

        expect(result).toMatchObject({
            statusCode: 200,
            body: JSON.stringify({ items: [], cursor: null }),
        });
    });

    it('should return 500 on error', async () => {
        mockListItems.mockRejectedValue(new Error('Service Failed'));

        const event = makeEvent();
        const result = await handler(event, {} as any, {} as any);

        expect(result.statusCode).toBe(500);
    });
});
