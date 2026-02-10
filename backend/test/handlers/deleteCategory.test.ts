import { vi, describe, it, expect, beforeEach } from 'vitest';
import { handler } from '../../src/handlers/deleteCategory';
import { CategoryService } from '../../src/application/category-service';

vi.mock('../../src/adapters/dynamo-category-repository');
vi.mock('../../src/adapters/event-bridge-publisher');
vi.mock('../../src/application/category-service', () => ({
    CategoryService: vi.fn().mockReturnValue({
        deleteCategory: vi.fn(),
    }),
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
    path: '/categories',
    stageVariables: null,
    requestContext: {} as any,
    resource: '',
    ...overrides,
});

describe('deleteCategory handler', () => {
    let mockDeleteCategory: any;

    beforeEach(() => {
        vi.clearAllMocks();
        const mockServiceInstance = new CategoryService({} as any, {} as any);
        mockDeleteCategory = mockServiceInstance.deleteCategory;
    });

    it('should delete a category', async () => {
        mockDeleteCategory.mockResolvedValue(undefined);

        const event = makeEvent({ pathParameters: { categoryId: 'cat-123' } });
        const result = await handler(event, {} as any, {} as any);

        expect(result.statusCode).toBe(200);
        expect(JSON.parse(result.body as string)).toEqual({ message: 'Category deleted' });
        expect(mockDeleteCategory).toHaveBeenCalledWith('cat-123');
    });

    it('should return 400 if categoryId is missing', async () => {
        const event = makeEvent({ pathParameters: {} });
        const result = await handler(event, {} as any, {} as any);
        expect(result.statusCode).toBe(400);
    });

    it('should return 500 on error', async () => {
        mockDeleteCategory.mockRejectedValue(new Error('boom'));
        const event = makeEvent({ pathParameters: { categoryId: 'cat-123' } });
        const result = await handler(event, {} as any, {} as any);
        expect(result.statusCode).toBe(500);
    });
});
