"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateOpenApiSpec = exports.registry = void 0;
const zod_to_openapi_1 = require("@asteasolutions/zod-to-openapi");
const zod_to_openapi_2 = require("@asteasolutions/zod-to-openapi");
const zod_1 = require("zod");
(0, zod_to_openapi_2.extendZodWithOpenApi)(zod_1.z);
exports.registry = new zod_to_openapi_1.OpenAPIRegistry();
// ── Bearer auth scheme ──
exports.registry.registerComponent('securitySchemes', 'BearerAuth', {
    type: 'http',
    scheme: 'bearer',
    bearerFormat: 'JWT',
    description: 'Cognito JWT access token',
});
// ── Shared schemas ──
const ErrorResponseSchema = zod_1.z.object({
    error: zod_1.z.object({
        code: zod_1.z.string().openapi({ example: 'NOT_FOUND' }),
        message: zod_1.z.string().openapi({ example: 'Item not found' }),
        details: zod_1.z.any().optional().openapi({ example: [{ path: 'name', message: 'Required' }] }),
        requestId: zod_1.z.string().optional().openapi({ example: 'abc-123-def' }),
    }),
}).openapi('ErrorResponse');
exports.registry.register('ErrorResponse', ErrorResponseSchema);
// ── Route registrations ──
exports.registry.registerPath({
    method: 'get',
    path: '/items',
    summary: 'List items (paginated)',
    description: 'Returns a paginated list of items. Use `limit` and `cursor` query parameters to navigate pages.',
    security: [{ BearerAuth: [] }],
    request: {
        query: zod_1.z.object({
            limit: zod_1.z.string().optional().openapi({ example: '20', description: 'Max items per page (default: 20)' }),
            cursor: zod_1.z.string().optional().openapi({ example: 'eyJway...', description: 'Cursor from previous response for next page' }),
        }),
    },
    responses: {
        200: {
            description: 'Paginated list of items',
            content: {
                'application/json': {
                    schema: zod_1.z.object({
                        items: zod_1.z.array(zod_1.z.object({
                            itemId: zod_1.z.string().openapi({ example: '123-abc' }),
                            name: zod_1.z.string().openapi({ example: 'Compass' }),
                            description: zod_1.z.string().nullable().optional().openapi({ example: 'A magnetic compass' }),
                            createdAt: zod_1.z.string().openapi({ example: '2024-01-01T00:00:00Z' }),
                        })),
                        cursor: zod_1.z.string().nullable().openapi({ example: 'eyJway...' }),
                    }),
                },
            },
        },
        401: {
            description: 'Unauthorized',
            content: { 'application/json': { schema: ErrorResponseSchema } },
        },
        500: {
            description: 'Internal server error',
            content: { 'application/json': { schema: ErrorResponseSchema } },
        },
    },
});
exports.registry.registerPath({
    method: 'post',
    path: '/items',
    summary: 'Create an item',
    description: 'Creates a new item. Returns the created item with generated `itemId` and `createdAt`.',
    security: [{ BearerAuth: [] }],
    request: {
        body: {
            content: {
                'application/json': {
                    schema: zod_1.z.object({
                        name: zod_1.z.string().min(1).openapi({ example: 'Compass' }),
                        description: zod_1.z.string().optional().openapi({ example: 'A magnetic compass' }),
                    }).openapi('CreateItemRequest'),
                },
            },
        },
    },
    responses: {
        201: {
            description: 'Item created successfully',
            content: {
                'application/json': {
                    schema: zod_1.z.object({
                        itemId: zod_1.z.string().openapi({ example: '123-abc' }),
                        name: zod_1.z.string().openapi({ example: 'Compass' }),
                        description: zod_1.z.string().nullable().optional().openapi({ example: 'A magnetic compass' }),
                        createdAt: zod_1.z.string().openapi({ example: '2024-01-01T00:00:00Z' }),
                    }).openapi('ItemResponse'),
                },
            },
        },
        400: {
            description: 'Validation error',
            content: { 'application/json': { schema: ErrorResponseSchema } },
        },
        401: {
            description: 'Unauthorized',
            content: { 'application/json': { schema: ErrorResponseSchema } },
        },
        500: {
            description: 'Internal server error',
            content: { 'application/json': { schema: ErrorResponseSchema } },
        },
    },
});
exports.registry.registerPath({
    method: 'get',
    path: '/items/{itemId}',
    summary: 'Get an item by ID',
    description: 'Returns a single item by its unique identifier.',
    security: [{ BearerAuth: [] }],
    request: {
        params: zod_1.z.object({
            itemId: zod_1.z.string().openapi({ example: '123-abc', description: 'Unique item identifier' }),
        }),
    },
    responses: {
        200: {
            description: 'Item found',
            content: {
                'application/json': {
                    schema: zod_1.z.object({
                        itemId: zod_1.z.string().openapi({ example: '123-abc' }),
                        name: zod_1.z.string().openapi({ example: 'Compass' }),
                        description: zod_1.z.string().nullable().optional().openapi({ example: 'A magnetic compass' }),
                        createdAt: zod_1.z.string().openapi({ example: '2024-01-01T00:00:00Z' }),
                    }),
                },
            },
        },
        400: {
            description: 'Missing itemId',
            content: { 'application/json': { schema: ErrorResponseSchema } },
        },
        404: {
            description: 'Item not found',
            content: { 'application/json': { schema: ErrorResponseSchema } },
        },
        401: {
            description: 'Unauthorized',
            content: { 'application/json': { schema: ErrorResponseSchema } },
        },
        500: {
            description: 'Internal server error',
            content: { 'application/json': { schema: ErrorResponseSchema } },
        },
    },
});
exports.registry.registerPath({
    method: 'delete',
    path: '/items/{itemId}',
    summary: 'Delete an item',
    description: 'Deletes an item by its unique identifier.',
    security: [{ BearerAuth: [] }],
    request: {
        params: zod_1.z.object({
            itemId: zod_1.z.string().openapi({ example: '123-abc', description: 'Unique item identifier' }),
        }),
    },
    responses: {
        200: {
            description: 'Item deleted successfully',
            content: {
                'application/json': {
                    schema: zod_1.z.object({
                        message: zod_1.z.string().openapi({ example: 'Item deleted' }),
                    }),
                },
            },
        },
        400: {
            description: 'Missing itemId',
            content: { 'application/json': { schema: ErrorResponseSchema } },
        },
        401: {
            description: 'Unauthorized',
            content: { 'application/json': { schema: ErrorResponseSchema } },
        },
        500: {
            description: 'Internal server error',
            content: { 'application/json': { schema: ErrorResponseSchema } },
        },
    },
});
// ── Category Routes ──
const CategoryResponseSchema = zod_1.z.object({
    categoryId: zod_1.z.string().openapi({ example: 'cat-abc-123' }),
    name: zod_1.z.string().openapi({ example: 'Plumbing' }),
    description: zod_1.z.string().nullable().optional().openapi({ example: 'Plumbing repairs and installations' }),
    createdAt: zod_1.z.string().openapi({ example: '2024-01-01T00:00:00Z' }),
});
exports.registry.registerPath({
    method: 'get',
    path: '/categories',
    summary: 'List categories (paginated)',
    description: 'Returns a paginated list of service categories.',
    security: [{ BearerAuth: [] }],
    request: {
        query: zod_1.z.object({
            limit: zod_1.z.string().optional().openapi({ example: '20', description: 'Max items per page (default: 20)' }),
            cursor: zod_1.z.string().optional().openapi({ example: 'eyJway...', description: 'Cursor from previous response' }),
        }),
    },
    responses: {
        200: {
            description: 'Paginated list of categories',
            content: {
                'application/json': {
                    schema: zod_1.z.object({
                        items: zod_1.z.array(CategoryResponseSchema),
                        cursor: zod_1.z.string().nullable().openapi({ example: 'eyJway...' }),
                    }),
                },
            },
        },
        401: { description: 'Unauthorized', content: { 'application/json': { schema: ErrorResponseSchema } } },
        500: { description: 'Internal server error', content: { 'application/json': { schema: ErrorResponseSchema } } },
    },
});
exports.registry.registerPath({
    method: 'post',
    path: '/categories',
    summary: 'Create a category',
    description: 'Creates a new service category.',
    security: [{ BearerAuth: [] }],
    request: {
        body: {
            content: {
                'application/json': {
                    schema: zod_1.z.object({
                        name: zod_1.z.string().min(1).openapi({ example: 'Plumbing' }),
                        description: zod_1.z.string().optional().openapi({ example: 'Plumbing repairs and installations' }),
                    }).openapi('CreateCategoryRequest'),
                },
            },
        },
    },
    responses: {
        201: { description: 'Category created', content: { 'application/json': { schema: CategoryResponseSchema } } },
        400: { description: 'Validation error', content: { 'application/json': { schema: ErrorResponseSchema } } },
        401: { description: 'Unauthorized', content: { 'application/json': { schema: ErrorResponseSchema } } },
        500: { description: 'Internal server error', content: { 'application/json': { schema: ErrorResponseSchema } } },
    },
});
exports.registry.registerPath({
    method: 'get',
    path: '/categories/{categoryId}',
    summary: 'Get a category by ID',
    description: 'Returns a single service category.',
    security: [{ BearerAuth: [] }],
    request: {
        params: zod_1.z.object({
            categoryId: zod_1.z.string().openapi({ example: 'cat-abc-123', description: 'Unique category identifier' }),
        }),
    },
    responses: {
        200: { description: 'Category found', content: { 'application/json': { schema: CategoryResponseSchema } } },
        400: { description: 'Missing categoryId', content: { 'application/json': { schema: ErrorResponseSchema } } },
        404: { description: 'Category not found', content: { 'application/json': { schema: ErrorResponseSchema } } },
        401: { description: 'Unauthorized', content: { 'application/json': { schema: ErrorResponseSchema } } },
        500: { description: 'Internal server error', content: { 'application/json': { schema: ErrorResponseSchema } } },
    },
});
exports.registry.registerPath({
    method: 'delete',
    path: '/categories/{categoryId}',
    summary: 'Delete a category',
    description: 'Deletes a service category by its unique identifier.',
    security: [{ BearerAuth: [] }],
    request: {
        params: zod_1.z.object({
            categoryId: zod_1.z.string().openapi({ example: 'cat-abc-123', description: 'Unique category identifier' }),
        }),
    },
    responses: {
        200: {
            description: 'Category deleted',
            content: { 'application/json': { schema: zod_1.z.object({ message: zod_1.z.string().openapi({ example: 'Category deleted' }) }) } },
        },
        400: { description: 'Missing categoryId', content: { 'application/json': { schema: ErrorResponseSchema } } },
        401: { description: 'Unauthorized', content: { 'application/json': { schema: ErrorResponseSchema } } },
        500: { description: 'Internal server error', content: { 'application/json': { schema: ErrorResponseSchema } } },
    },
});
function generateOpenApiSpec() {
    const generator = new zod_to_openapi_1.OpenApiGeneratorV3(exports.registry.definitions);
    return generator.generateDocument({
        openapi: '3.0.0',
        info: {
            title: 'Test Service API',
            version: '1.0.0',
            description: 'API for Test Service',
        },
        servers: [
            {
                url: 'https://{apiId}.execute-api.{region}.amazonaws.com/prod',
                description: 'Production',
                variables: {
                    apiId: { default: 'xxxxx' },
                    region: { default: 'us-east-1' },
                },
            },
            {
                url: 'http://localhost:3001',
                description: 'Local Development',
            },
        ],
    });
}
exports.generateOpenApiSpec = generateOpenApiSpec;
