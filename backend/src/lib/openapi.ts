import { OpenApiGeneratorV3, OpenAPIRegistry } from '@asteasolutions/zod-to-openapi';
import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
import { z } from 'zod';

extendZodWithOpenApi(z);

export const registry = new OpenAPIRegistry();

// ── Bearer auth scheme ──

registry.registerComponent('securitySchemes', 'BearerAuth', {
    type: 'http',
    scheme: 'bearer',
    bearerFormat: 'JWT',
    description: 'Cognito JWT access token',
});

// ── Shared schemas ──

const ErrorResponseSchema = z.object({
    error: z.object({
        code: z.string().openapi({ example: 'NOT_FOUND' }),
        message: z.string().openapi({ example: 'Item not found' }),
        details: z.any().optional().openapi({ example: [{ path: 'name', message: 'Required' }] }),
        requestId: z.string().optional().openapi({ example: 'abc-123-def' }),
    }),
}).openapi('ErrorResponse');

registry.register('ErrorResponse', ErrorResponseSchema);

// ── Route registrations ──

registry.registerPath({
    method: 'get',
    path: '/items',
    summary: 'List items (paginated)',
    description: 'Returns a paginated list of items. Use `limit` and `cursor` query parameters to navigate pages.',
    security: [{ BearerAuth: [] }],
    request: {
        query: z.object({
            limit: z.string().optional().openapi({ example: '20', description: 'Max items per page (default: 20)' }),
            cursor: z.string().optional().openapi({ example: 'eyJway...', description: 'Cursor from previous response for next page' }),
        }),
    },
    responses: {
        200: {
            description: 'Paginated list of items',
            content: {
                'application/json': {
                    schema: z.object({
                        items: z.array(z.object({
                            itemId: z.string().openapi({ example: '123-abc' }),
                            name: z.string().openapi({ example: 'Compass' }),
                            description: z.string().nullable().optional().openapi({ example: 'A magnetic compass' }),
                            createdAt: z.string().openapi({ example: '2024-01-01T00:00:00Z' }),
                        })),
                        cursor: z.string().nullable().openapi({ example: 'eyJway...' }),
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

registry.registerPath({
    method: 'post',
    path: '/items',
    summary: 'Create an item',
    description: 'Creates a new item. Returns the created item with generated `itemId` and `createdAt`.',
    security: [{ BearerAuth: [] }],
    request: {
        body: {
            content: {
                'application/json': {
                    schema: z.object({
                        name: z.string().min(1).openapi({ example: 'Compass' }),
                        description: z.string().optional().openapi({ example: 'A magnetic compass' }),
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
                    schema: z.object({
                        itemId: z.string().openapi({ example: '123-abc' }),
                        name: z.string().openapi({ example: 'Compass' }),
                        description: z.string().nullable().optional().openapi({ example: 'A magnetic compass' }),
                        createdAt: z.string().openapi({ example: '2024-01-01T00:00:00Z' }),
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

registry.registerPath({
    method: 'get',
    path: '/items/{itemId}',
    summary: 'Get an item by ID',
    description: 'Returns a single item by its unique identifier.',
    security: [{ BearerAuth: [] }],
    request: {
        params: z.object({
            itemId: z.string().openapi({ example: '123-abc', description: 'Unique item identifier' }),
        }),
    },
    responses: {
        200: {
            description: 'Item found',
            content: {
                'application/json': {
                    schema: z.object({
                        itemId: z.string().openapi({ example: '123-abc' }),
                        name: z.string().openapi({ example: 'Compass' }),
                        description: z.string().nullable().optional().openapi({ example: 'A magnetic compass' }),
                        createdAt: z.string().openapi({ example: '2024-01-01T00:00:00Z' }),
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

registry.registerPath({
    method: 'delete',
    path: '/items/{itemId}',
    summary: 'Delete an item',
    description: 'Deletes an item by its unique identifier.',
    security: [{ BearerAuth: [] }],
    request: {
        params: z.object({
            itemId: z.string().openapi({ example: '123-abc', description: 'Unique item identifier' }),
        }),
    },
    responses: {
        200: {
            description: 'Item deleted successfully',
            content: {
                'application/json': {
                    schema: z.object({
                        message: z.string().openapi({ example: 'Item deleted' }),
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

export function generateOpenApiSpec() {
    const generator = new OpenApiGeneratorV3(registry.definitions);

    return generator.generateDocument({
        openapi: '3.0.0',
        info: {
            version: '1.0.0',
            title: 'HMaaS API',
            description: 'Home Maintenance as a Service — RESTful API for managing items. All endpoints require a valid Cognito JWT bearer token.',
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
