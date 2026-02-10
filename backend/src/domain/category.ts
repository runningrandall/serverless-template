import { PaginationOptions, PaginatedResult } from "../domain/item";

export interface Category {
    categoryId: string;
    name: string;
    description?: string;
    createdAt: string;
}

export interface CreateCategoryRequest {
    name: string;
    description?: string;
}

export interface CategoryRepository {
    create(category: Category): Promise<Category>;
    get(categoryId: string): Promise<Category | null>;
    list(options?: PaginationOptions): Promise<PaginatedResult<Category>>;
    delete(categoryId: string): Promise<void>;
}
