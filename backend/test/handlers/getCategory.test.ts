import { vi, describe, it, expect, beforeEach } from 'vitest';
import { handler } from '../../src/handlers/getCategory';
import { CategoryService } from '../../src/application/category-service';

vi.mock('../../src/adapters/dynamo-category-repository');
vi.mock('../../src/adapters/event-bridge-publisher');
vi.mock('../../src/application/category-service', () => ({
    CategoryService: vi.fn().mockReturnValue({
        getCategory: vi.fn(),
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

describe('getCategory handler', () => {
    let mockGetCategory: any;

    beforeEach(() => {
        vi.clearAllMocks();
        const mockServiceInstance = new CategoryService({} as any, {} as any);
        mockGetCategory = mockServiceInstance.getCategory;
    });

    it('should return a category by ID', async () => {
        const mockCategory = { categoryId: 'cat-123', name: 'Plumbing' };
        mockGetCategory.mockResolvedValue(mockCategory);

        const event = makeEvent({ pathParameters: { categoryId: 'cat-123' } });
        const result = await handler(event, {} as any, {} as any);

        expect(result.statusCode).toBe(200);
        expect(JSON.parse(result.body as string)).toEqual(mockCategory);
    });

    it('should return 400 if categoryId is missing', async () => {
        const event = makeEvent({ pathParameters: {} });
        const result = await handler(event, {} as any, {} as any);
        expect(result.statusCode).toBe(400);
    });

    it('should return 404 if category not found', async () => {
        const { AppError } = await import('../../src/lib/error');
        mockGetCategory.mockRejectedValue(new AppError('Category not found', 404));

        const event = makeEvent({ pathParameters: { categoryId: 'nope' } });
        const result = await handler(event, {} as any, {} as any);
        expect(result.statusCode).toBe(404);
    });

    it('should return 500 on unexpected error', async () => {
        mockGetCategory.mockRejectedValue(new Error('boom'));
        const event = makeEvent({ pathParameters: { categoryId: 'cat-123' } });
        const result = await handler(event, {} as any, {} as any);
        expect(result.statusCode).toBe(500);
    });
});
