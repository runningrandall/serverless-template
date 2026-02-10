import { z } from 'zod';
import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
import { registry } from './openapi';

extendZodWithOpenApi(z);

export const CreateItemSchema = z.object({
    name: z.string().min(1, "Name is required").openapi({ example: 'Compass' }),
    description: z.string().optional().openapi({ example: 'A magnetic compass' }),
}).openapi('CreateItem');

registry.register('CreateItem', CreateItemSchema);

export type CreateItemRequest = z.infer<typeof CreateItemSchema>;

export const ItemSchema = CreateItemSchema.extend({
    itemId: z.string().openapi({ example: '123-abc' }),
    createdAt: z.number().optional().openapi({ example: 1678900000000 }),
    updatedAt: z.number().optional().openapi({ example: 1678900000000 }),
}).openapi('Item');

registry.register('Item', ItemSchema);

