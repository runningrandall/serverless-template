import { generateOpenApiSpec, registry } from '../src/lib/openapi';
import '../src/lib/schemas'; // Ensure schemas are registered
import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'yaml';
import { z } from 'zod';

// Define Paths manually for now since we don't have automatic controller scanning
registry.registerPath({
    method: 'get',
    path: '/items',
    summary: 'List all items',
    responses: {
        200: {
            description: 'List of items',
            content: {
                'application/json': {
                    schema: {
                        type: 'array',
                        items: { $ref: '#/components/schemas/Item' },
                    },
                },
            },
        },
    },
});

registry.registerPath({
    method: 'post',
    path: '/items',
    summary: 'Create a new item',
    request: {
        body: {
            content: {
                'application/json': {
                    schema: { $ref: '#/components/schemas/CreateItem' },
                },
            },
        },
    },
    responses: {
        201: {
            description: 'Item created',
            content: {
                'application/json': {
                    schema: { $ref: '#/components/schemas/Item' },
                },
            },
        },
        400: {
            description: 'Validation Error',
        },
    },
});

const ItemIdParams = z.object({
    itemId: z.string().openapi({ param: { name: 'itemId', in: 'path' }, example: '123' }),
});

registry.registerPath({
    method: 'get',
    path: '/items/{itemId}',
    summary: 'Get an item by ID',
    request: {
        params: ItemIdParams,
    },
    responses: {
        200: {
            description: 'Item details',
            content: {
                'application/json': {
                    schema: { $ref: '#/components/schemas/Item' },
                },
            },
        },
        404: {
            description: 'Item not found',
        },
    },
});

registry.registerPath({
    method: 'delete',
    path: '/items/{itemId}',
    summary: 'Delete an item',
    request: {
        params: ItemIdParams,
    },
    responses: {
        200: {
            description: 'Item deleted',
        },
    },
});


const spec = generateOpenApiSpec();
const yamlSpec = yaml.stringify(spec);
const jsonSpec = JSON.stringify(spec, null, 2);

const outputDir = path.join(__dirname, '../');
fs.writeFileSync(path.join(outputDir, 'openapi.yaml'), yamlSpec);
fs.writeFileSync(path.join(outputDir, 'openapi.json'), jsonSpec);

console.log('OpenAPI spec generated at backend/openapi.json and backend/openapi.yaml');
