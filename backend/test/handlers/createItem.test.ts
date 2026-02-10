import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { handler } from '../../src/handlers/createItem';
import { ItemEntity } from '../../src/entities/item';

// Mock electrodb Entity
vi.mock('../../src/entities/item', () => ({
    ItemEntity: {
        create: vi.fn(),
    },
}));

// Mock EventBridge Client using vi.hoisted to avoid ReferenceError
const { mockSend } = vi.hoisted(() => {
    return { mockSend: vi.fn() };
});

vi.mock('@aws-sdk/client-eventbridge', () => ({
    EventBridgeClient: vi.fn(() => ({
        send: mockSend,
    })),
    PutEventsCommand: vi.fn(),
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

        const event = makeEvent({
            body: JSON.stringify({ name: 'Test Item', description: 'desc' }),
        });

        const result = await handler(event, {} as any, {} as any);

        expect(result).toMatchObject({
            statusCode: 201,
            body: JSON.stringify(mockItem),
        });
        expect(ItemEntity.create).toHaveBeenCalledWith(expect.objectContaining({
            name: 'Test Item',
            description: 'desc',
            itemId: expect.any(String)
        }));
        expect(mockSend).not.toHaveBeenCalled();
    });

    it('should create an item and publish event when env var is set', async () => {
        process.env.EVENT_BUS_NAME = 'test-bus';
        const mockItem = { itemId: '123', name: 'Test Item', description: 'desc' };

        const mockGo = vi.fn().mockResolvedValue({ data: mockItem });
        (ItemEntity.create as any).mockReturnValue({ go: mockGo });

        const event = makeEvent({
            body: JSON.stringify({ name: 'Test Item', description: 'desc' }),
        });

        await handler(event, {} as any, {} as any);

        expect(ItemEntity.create).toHaveBeenCalledWith(expect.objectContaining({
            name: 'Test Item',
            description: 'desc',
            itemId: expect.any(String)
        }));

        expect(mockSend).toHaveBeenCalledTimes(1);
        expect(mockSend).toHaveBeenCalledWith(expect.any(Object));
    });

    it('should return 400 if body is missing', async () => {
        const event = makeEvent({ body: null });
        const result = await handler(event, {} as any, {} as any);

        expect(result.statusCode).toBe(400);
    });

    it('should return 400 if validation fails', async () => {
        const event = makeEvent({
            body: JSON.stringify({ description: 'Missing name' }),
        });
        const result = await handler(event, {} as any, {} as any);

        expect(result.statusCode).toBe(400);
        const body = JSON.parse(result.body as string);
        expect(body.error).toBe('Validation failed');
        expect(body.details).toBeDefined();
    });

    it('should return 500 on error', async () => {
        const errorMsg = 'DB Error';
        const mockGo = vi.fn().mockRejectedValue(new Error(errorMsg));
        (ItemEntity.create as any).mockReturnValue({ go: mockGo });

        const event = makeEvent({
            body: JSON.stringify({ name: 'Fail' }),
        });

        const result = await handler(event, {} as any, {} as any);

        expect(result.statusCode).toBe(500);
    });
});
