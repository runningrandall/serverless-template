export interface Item {
    itemId: string;
    name: string;
    description?: string | null;
    createdAt: string;
}

export interface CreateItemRequest {
    name: string;
    description?: string;
}

export interface ItemRepository {
    create(item: Item): Promise<Item>;
    get(itemId: string): Promise<Item | null>;
    list(): Promise<Item[]>;
    delete(itemId: string): Promise<void>;
}

export interface EventPublisher {
    publish(eventName: string, payload: any): Promise<void>;
}
