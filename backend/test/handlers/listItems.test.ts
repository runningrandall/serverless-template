import { vi, describe, it, expect, beforeEach } from 'vitest';
import { handler } from '../../src/handlers/listItems';
import { ItemEntity } from '../../src/entities/item';

vi.mock('../../src/entities/item', () => ({
    ItemEntity: {
        scan: {
            go: vi.fn(),
        },
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

describe('listItems handler', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should list items successfully', async () => {
        const mockItems = [
            { itemId: '1', name: 'Item 1' },
            { itemId: '2', name: 'Item 2' },
        ];
        (ItemEntity.scan.go as any).mockResolvedValue({ data: mockItems });

        const event = makeEvent();
        const result = await handler(event, {} as any, {} as any);

        expect(result).toMatchObject({
            statusCode: 200,
            body: JSON.stringify(mockItems),
        });
    });

    it('should return empty array when no items exist', async () => {
        (ItemEntity.scan.go as any).mockResolvedValue({ data: [] });

        const event = makeEvent();
        const result = await handler(event, {} as any, {} as any);

        expect(result).toMatchObject({
            statusCode: 200,
            body: JSON.stringify([]),
        });
    });

    it('should return 500 on error', async () => {
        (ItemEntity.scan.go as any).mockRejectedValue(new Error('DB Error'));

        const event = makeEvent();
        const result = await handler(event, {} as any, {} as any);

        expect(result.statusCode).toBe(500);
    });
});
