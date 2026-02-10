/**
 * Generate API documentation from the OpenAPI registry.
 * Outputs:
 *  - docs/swagger.json   (OpenAPI 3.0 spec)
 *  - docs/api.md          (Markdown documentation)
 *
 * Usage: npx tsx scripts/generate-api-docs.ts
 */
import { generateOpenApiSpec } from '../src/lib/openapi';
import * as fs from 'fs';
import * as path from 'path';

// Ensure schemas are registered by importing schemas.ts
import '../src/lib/schemas';

const spec = generateOpenApiSpec();
const docsDir = path.join(__dirname, '../../docs');

// Ensure docs directory exists
fs.mkdirSync(docsDir, { recursive: true });

// ── Write swagger.json ──
const swaggerPath = path.join(docsDir, 'swagger.json');
fs.writeFileSync(swaggerPath, JSON.stringify(spec, null, 2));
console.log(`✅ Written ${swaggerPath}`);

// ── Generate Markdown ──
function generateMarkdown(spec: any): string {
    const lines: string[] = [];

    lines.push(`# ${spec.info.title}`);
    lines.push('');
    lines.push(`> ${spec.info.description}`);
    lines.push('');
    lines.push(`**Version:** ${spec.info.version} | **OpenAPI Spec:** [swagger.json](swagger.json)`);
    lines.push('');

    // Servers
    lines.push('## Servers');
    lines.push('');
    lines.push('| Name | URL |');
    lines.push('|------|-----|');
    for (const server of spec.servers || []) {
        lines.push(`| ${server.description || ''} | \`${server.url}\` |`);
    }
    lines.push('');

    // Auth
    if (spec.components?.securitySchemes) {
        lines.push('## Authentication');
        lines.push('');
        for (const [name, scheme] of Object.entries<any>(spec.components.securitySchemes)) {
            lines.push(`All endpoints require **${scheme.scheme} authentication** (\`${scheme.bearerFormat}\`).`);
            lines.push('');
            lines.push('```');
            lines.push(`Authorization: Bearer <token>`);
            lines.push('```');
            lines.push('');
        }
    }

    // Endpoints
    lines.push('## Endpoints');
    lines.push('');

    // Table of contents
    lines.push('| Method | Path | Summary |');
    lines.push('|--------|------|---------|');

    const sortedPaths = Object.entries(spec.paths || {}).sort(([a], [b]) => a.localeCompare(b));

    for (const [path, methods] of sortedPaths) {
        for (const [method, op] of Object.entries<any>(methods as any)) {
            lines.push(`| \`${method.toUpperCase()}\` | \`${path}\` | ${(op as any).summary} |`);
        }
    }
    lines.push('');

    // Detailed endpoints
    lines.push('---');
    lines.push('');

    for (const [apiPath, methods] of sortedPaths) {
        for (const [method, op] of Object.entries<any>(methods as any)) {
            const operation = op as any;
            lines.push(`### \`${method.toUpperCase()} ${apiPath}\``);
            lines.push('');
            lines.push(operation.description || operation.summary || '');
            lines.push('');

            // Parameters
            const params = operation.parameters || [];
            if (params.length > 0) {
                lines.push('**Parameters:**');
                lines.push('');
                lines.push('| Name | In | Type | Required | Description |');
                lines.push('|------|----|------|----------|-------------|');
                for (const param of params) {
                    const type = param.schema?.type || 'string';
                    const required = param.required ? '✅' : '❌';
                    lines.push(`| \`${param.name}\` | ${param.in} | \`${type}\` | ${required} | ${param.description || param.schema?.description || ''} |`);
                }
                lines.push('');
            }

            // Request body
            if (operation.requestBody) {
                lines.push('**Request Body:**');
                lines.push('');
                const content = operation.requestBody.content?.['application/json'];
                if (content?.schema) {
                    const schema = resolveSchema(content.schema, spec);
                    lines.push('```json');
                    lines.push(JSON.stringify(schemaToExample(schema), null, 2));
                    lines.push('```');
                    lines.push('');

                    // Fields table
                    if (schema.properties) {
                        lines.push('| Field | Type | Required | Description |');
                        lines.push('|-------|------|----------|-------------|');
                        const required = schema.required || [];
                        for (const [field, fieldSchema] of Object.entries<any>(schema.properties)) {
                            const isRequired = required.includes(field) ? '✅' : '❌';
                            lines.push(`| \`${field}\` | \`${fieldSchema.type || 'string'}\` | ${isRequired} | ${fieldSchema.description || ''} |`);
                        }
                        lines.push('');
                    }
                }
            }

            // Responses
            lines.push('**Responses:**');
            lines.push('');
            for (const [status, resp] of Object.entries<any>(operation.responses || {})) {
                const response = resp as any;
                lines.push(`<details>`);
                lines.push(`<summary><code>${status}</code> — ${response.description}</summary>`);
                lines.push('');
                const content = response.content?.['application/json'];
                if (content?.schema) {
                    const schema = resolveSchema(content.schema, spec);
                    lines.push('```json');
                    lines.push(JSON.stringify(schemaToExample(schema), null, 2));
                    lines.push('```');
                }
                lines.push('');
                lines.push('</details>');
                lines.push('');
            }

            lines.push('---');
            lines.push('');
        }
    }

    // Schemas
    if (spec.components?.schemas) {
        lines.push('## Schemas');
        lines.push('');
        for (const [name, schema] of Object.entries<any>(spec.components.schemas)) {
            lines.push(`### ${name}`);
            lines.push('');
            lines.push('```json');
            lines.push(JSON.stringify(schema, null, 2));
            lines.push('```');
            lines.push('');
        }
    }

    // Footer
    lines.push('---');
    lines.push('');
    lines.push(`*Generated at ${new Date().toISOString()} from OpenAPI spec.*`);

    return lines.join('\n');
}

function resolveSchema(schema: any, spec: any): any {
    if (schema.$ref) {
        const refName = schema.$ref.replace('#/components/schemas/', '');
        return spec.components?.schemas?.[refName] || schema;
    }
    return schema;
}

function schemaToExample(schema: any): any {
    if (!schema) return {};

    if (schema.example !== undefined) return schema.example;

    if (schema.type === 'array') {
        const itemExample = schemaToExample(schema.items);
        return [itemExample];
    }

    if (schema.type === 'object' || schema.properties) {
        const obj: Record<string, any> = {};
        for (const [key, prop] of Object.entries<any>(schema.properties || {})) {
            if (prop.example !== undefined) {
                obj[key] = prop.example;
            } else if (prop.type === 'object' || prop.properties) {
                obj[key] = schemaToExample(prop);
            } else if (prop.type === 'array') {
                obj[key] = schemaToExample(prop);
            } else {
                obj[key] = `<${prop.type || 'string'}>`;
            }
        }
        return obj;
    }

    return schema.example || `<${schema.type || 'any'}>`;
}

const markdown = generateMarkdown(spec);
const apiMdPath = path.join(docsDir, 'api.md');
fs.writeFileSync(apiMdPath, markdown);
console.log(`✅ Written ${apiMdPath}`);
