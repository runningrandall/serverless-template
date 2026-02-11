export interface Item {
    itemId: string;
    name: string;
    description?: string;
    createdAt: string;
}

export interface CreateItemRequest {
    name: string;
    description?: string;
}

export interface PaginationOptions {
    limit?: number;
    cursor?: string;
}

export interface PaginatedResult<T> {
    items: T[];
    cursor?: string | null;
}

export interface ItemRepository {
    create(item: Item): Promise<Item>;
    get(itemId: string): Promise<Item | null>;
    list(options?: PaginationOptions): Promise<PaginatedResult<Item>>;
    delete(itemId: string): Promise<void>;
}

export interface EventPublisher {
    publish(eventName: string, payload: any): Promise<void>;
}
