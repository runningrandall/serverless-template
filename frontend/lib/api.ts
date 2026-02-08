const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

export interface Item {
    itemId: string;
    name: string;
    description?: string;
    createdAt: number;
}

export const api = {
    listItems: async (): Promise<Item[]> => {
        const res = await fetch(`${API_URL}/items`);
        if (!res.ok) throw new Error('Failed to fetch items');
        return res.json();
    },

    createItem: async (name: string, description?: string): Promise<Item> => {
        const res = await fetch(`${API_URL}/items`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                itemId: crypto.randomUUID(), // Client-side ID generation for simplicity, or server can do it
                name,
                description,
            }),
        });
        if (!res.ok) throw new Error('Failed to create item');
        return res.json();
    },

    deleteItem: async (itemId: string): Promise<void> => {
        const res = await fetch(`${API_URL}/items/${itemId}`, {
            method: 'DELETE',
        });
        if (!res.ok) throw new Error('Failed to delete item');
    },
};
