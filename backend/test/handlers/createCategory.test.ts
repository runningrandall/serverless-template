import { vi, describe, it, expect, beforeEach } from 'vitest';
import { handler } from '../../src/handlers/createCategory';
import { CategoryService } from '../../src/application/category-service';

vi.mock('../../src/adapters/dynamo-category-repository');
vi.mock('../../src/adapters/event-bridge-publisher');
vi.mock('../../src/application/category-service', () => ({
    CategoryService: vi.fn().mockReturnValue({
        createCategory: vi.fn(),
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
    path: '/categories',
    stageVariables: null,
    requestContext: {} as any,
    resource: '',
    ...overrides,
});

describe('createCategory handler', () => {
    let mockCreateCategory: any;

    beforeEach(() => {
        vi.clearAllMocks();
        const mockServiceInstance = new CategoryService({} as any, {} as any);
        mockCreateCategory = mockServiceInstance.createCategory;
    });

    it('should create a category successfully', async () => {
        const mockCategory = { categoryId: 'cat-123', name: 'Plumbing', description: 'Plumbing services' };
        mockCreateCategory.mockResolvedValue(mockCategory);

        const event = makeEvent({
            body: JSON.stringify({ name: 'Plumbing', description: 'Plumbing services' }),
        });

        const result = await handler(event, {} as any, {} as any);

        expect(result).toMatchObject({
            statusCode: 201,
            body: JSON.stringify(mockCategory),
        });
        expect(mockCreateCategory).toHaveBeenCalledWith(expect.objectContaining({
            name: 'Plumbing',
            description: 'Plumbing services',
        }));
    });

    it('should return 400 if body is missing', async () => {
        const event = makeEvent({ body: null });
        const result = await handler(event, {} as any, {} as any);
        expect(result.statusCode).toBe(400);
        expect(mockCreateCategory).not.toHaveBeenCalled();
    });

    it('should return 400 if validation fails', async () => {
        const event = makeEvent({
            body: JSON.stringify({ description: 'Missing name' }),
        });
        const result = await handler(event, {} as any, {} as any);
        expect(result.statusCode).toBe(400);
        const body = JSON.parse(result.body as string);
        expect(body.error.code).toBe('VALIDATION_ERROR');
        expect(mockCreateCategory).not.toHaveBeenCalled();
    });

    it('should return 500 on service error', async () => {
        mockCreateCategory.mockRejectedValue(new Error('Service Failed'));
        const event = makeEvent({
            body: JSON.stringify({ name: 'Fail' }),
        });
        const result = await handler(event, {} as any, {} as any);
        expect(result.statusCode).toBe(500);
    });
});
