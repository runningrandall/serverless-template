"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CategorySchema = exports.CreateCategorySchema = void 0;
const zod_1 = require("zod");
const zod_to_openapi_1 = require("@asteasolutions/zod-to-openapi");
(0, zod_to_openapi_1.extendZodWithOpenApi)(zod_1.z);
exports.CreateCategorySchema = zod_1.z.object({
    name: zod_1.z.string().min(1, "Name is required").openapi({ example: 'Plumbing' }),
    description: zod_1.z.string().optional().openapi({ example: 'Plumbing repairs and installations' }),
}).openapi('CreateCategory');
exports.CategorySchema = exports.CreateCategorySchema.extend({
    categoryId: zod_1.z.string().openapi({ example: 'cat-abc-123' }),
    createdAt: zod_1.z.number().optional().openapi({ example: 1678900000000 }),
    updatedAt: zod_1.z.number().optional().openapi({ example: 1678900000000 }),
}).openapi('Category');
