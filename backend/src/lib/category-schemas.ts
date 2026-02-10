import { z } from 'zod';
import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';

extendZodWithOpenApi(z);

export const CreateCategorySchema = z.object({
    name: z.string().min(1, "Name is required").openapi({ example: 'Plumbing' }),
    description: z.string().optional().openapi({ example: 'Plumbing repairs and installations' }),
}).openapi('CreateCategory');

export type CreateCategoryRequest = z.infer<typeof CreateCategorySchema>;

export const CategorySchema = CreateCategorySchema.extend({
    categoryId: z.string().openapi({ example: 'cat-abc-123' }),
    createdAt: z.number().optional().openapi({ example: 1678900000000 }),
    updatedAt: z.number().optional().openapi({ example: 1678900000000 }),
}).openapi('Category');
