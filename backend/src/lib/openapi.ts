import { OpenApiGeneratorV3, OpenAPIRegistry } from '@asteasolutions/zod-to-openapi';

export const registry = new OpenAPIRegistry();

export function generateOpenApiSpec() {
    const generator = new OpenApiGeneratorV3(registry.definitions);

    return generator.generateDocument({
        openapi: '3.0.0',
        info: {
            version: '1.0.0',
            title: 'Serverless Template API',
            description: 'API for the Serverless Template Application',
        },
        servers: [
            {
                url: 'http://localhost:3001', // Local default, can be overridden
                description: 'Local Server',
            },
        ],
    });
}
