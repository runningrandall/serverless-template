import { vi, describe, it, expect, beforeEach } from 'vitest';
import { handler } from '../../src/handlers/listCategorys';
import { CategoryService } from '../../src/application/category-service';

vi.mock('../../src/adapters/dynamo-category-repository');
vi.mock('../../src/adapters/event-bridge-publisher');
vi.mock('../../src/application/category-service', () => ({
    CategoryService: vi.fn().mockReturnValue({
        listCategories: vi.fn(),
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
    path: '/categories',
    stageVariables: null,
    requestContext: {} as any,
    resource: '',
    ...overrides,
});

describe('listCategorys handler', () => {
    let mockListCategories: any;

    beforeEach(() => {
        vi.clearAllMocks();
        const mockServiceInstance = new CategoryService({} as any, {} as any);
        mockListCategories = mockServiceInstance.listCategories;
    });

    it('should return paginated categories', async () => {
        const mockResult = { items: [{ categoryId: 'cat-1', name: 'Plumbing' }], cursor: null };
        mockListCategories.mockResolvedValue(mockResult);

        const event = makeEvent();
        const result = await handler(event, {} as any, {} as any);

        expect(result.statusCode).toBe(200);
        expect(JSON.parse(result.body as string)).toEqual(mockResult);
    });

    it('should pass limit and cursor query params', async () => {
        const mockResult = { items: [], cursor: null };
        mockListCategories.mockResolvedValue(mockResult);

        const event = makeEvent({ queryStringParameters: { limit: '5', cursor: 'abc' } });
        await handler(event, {} as any, {} as any);

        expect(mockListCategories).toHaveBeenCalledWith({ limit: 5, cursor: 'abc' });
    });

    it('should handle default pagination', async () => {
        const mockResult = { items: [], cursor: null };
        mockListCategories.mockResolvedValue(mockResult);

        const event = makeEvent();
        await handler(event, {} as any, {} as any);

        expect(mockListCategories).toHaveBeenCalledWith({ limit: undefined, cursor: undefined });
    });

    it('should return 500 on error', async () => {
        mockListCategories.mockRejectedValue(new Error('boom'));
        const event = makeEvent();
        const result = await handler(event, {} as any, {} as any);
        expect(result.statusCode).toBe(500);
    });
});
