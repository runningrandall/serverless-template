"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ItemSchema = exports.CreateItemSchema = void 0;
const zod_1 = require("zod");
const zod_to_openapi_1 = require("@asteasolutions/zod-to-openapi");
const openapi_1 = require("./openapi");
(0, zod_to_openapi_1.extendZodWithOpenApi)(zod_1.z);
exports.CreateItemSchema = zod_1.z.object({
    name: zod_1.z.string().min(1, "Name is required").openapi({ example: 'Compass' }),
    description: zod_1.z.string().optional().openapi({ example: 'A magnetic compass' }),
}).openapi('CreateItem');
openapi_1.registry.register('CreateItem', exports.CreateItemSchema);
exports.ItemSchema = exports.CreateItemSchema.extend({
    itemId: zod_1.z.string().openapi({ example: '123-abc' }),
    createdAt: zod_1.z.number().optional().openapi({ example: 1678900000000 }),
    updatedAt: zod_1.z.number().optional().openapi({ example: 1678900000000 }),
}).openapi('Item');
openapi_1.registry.register('Item', exports.ItemSchema);
