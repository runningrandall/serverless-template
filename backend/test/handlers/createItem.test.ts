import { vi, describe, it, expect, beforeEach } from 'vitest';
import { handler } from '../../src/handlers/createItem';
import { ItemService } from '../../src/application/item-service';

// Mock dependencies
vi.mock('../../src/adapters/dynamo-item-repository');
vi.mock('../../src/adapters/event-bridge-publisher');
vi.mock('../../src/application/item-service', () => ({
    ItemService: vi.fn().mockReturnValue({
        createItem: vi.fn(),
    }),
}));

const makeEvent = (overrides: Record<string, any> = {}) => ({
    headers: { 'Content-Type': 'application/json' },
    body: null,
    pathParameters: null,
    queryStringParameters: null,
    multiValueHeaders: {},
    multiValueQueryStringParameters: null,
    httpMethod: 'POST',
    isBase64Encoded: false,
    path: '/items',
    stageVariables: null,
    requestContext: {} as any,
    resource: '',
    ...overrides,
});

describe('createItem handler', () => {
    let mockCreateItem: any;

    beforeEach(() => {
        vi.clearAllMocks();
        // Get the mock instance
        const mockServiceInstance = new ItemService({} as any, {} as any);
        mockCreateItem = mockServiceInstance.createItem;
    });

    it('should create an item successfully', async () => {
        const mockItem = { itemId: '123', name: 'Test Item', description: 'desc' };
        mockCreateItem.mockResolvedValue(mockItem);

        const event = makeEvent({
            body: JSON.stringify({ name: 'Test Item', description: 'desc' }),
        });

        const result = await handler(event, {} as any, {} as any);

        expect(result).toMatchObject({
            statusCode: 201,
            body: JSON.stringify(mockItem),
        });
        expect(mockCreateItem).toHaveBeenCalledWith(expect.objectContaining({
            name: 'Test Item',
            description: 'desc',
        }));
    });

    it('should return 400 if body is missing', async () => {
        const event = makeEvent({ body: null });
        const result = await handler(event, {} as any, {} as any);

        expect(result.statusCode).toBe(400);
        expect(mockCreateItem).not.toHaveBeenCalled();
    });

    it('should return 400 if validation fails', async () => {
        const event = makeEvent({
            body: JSON.stringify({ description: 'Missing name' }),
        });
        const result = await handler(event, {} as any, {} as any);

        expect(result.statusCode).toBe(400);
        const body = JSON.parse(result.body as string);
        expect(body.error.code).toBe('VALIDATION_ERROR');
        expect(body.error.message).toBe('Validation failed');
        expect(body.error.details).toBeDefined();
        expect(mockCreateItem).not.toHaveBeenCalled();
    });

    it('should return 500 on error', async () => {
        mockCreateItem.mockRejectedValue(new Error('Service Failed'));

        const event = makeEvent({
            body: JSON.stringify({ name: 'Fail' }),
        });

        const result = await handler(event, {} as any, {} as any);

        expect(result.statusCode).toBe(500);
    });
});

