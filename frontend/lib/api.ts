import { fetchAuthSession } from 'aws-amplify/auth';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/';


export interface Report {
    reportId: string;
    createdAt: string;
    description: string;
    concernType: string;
    location: {
        lat: number;
        lng: number;
    };
    imageKeys: string[];
    emailLocation?: string;
    imageUrls?: string[]; // Presigned URLs
}

export interface Item {
    pk: string;
    sk: string;
    itemId: string;
    name: string;
    description: string;
    createdAt: string;
    updatedAt: string;
}

async function getHeaders() {
    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
    };

    try {
        const session = await fetchAuthSession();
        const token = session.tokens?.accessToken?.toString();
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }
    } catch (e) {
        console.debug('No auth session found', e);
    }

    return headers;
}

export async function listItems() {
    const headers = await getHeaders();
    const res = await fetch(`${API_URL}items`, { headers, cache: 'no-store' });
    if (!res.ok) throw new Error('Failed to fetch items');
    return res.json();
}

export async function createItem(name: string, description: string) {
    const headers = await getHeaders();
    const res = await fetch(`${API_URL}items`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ name, description }),
    });
    if (!res.ok) throw new Error('Failed to create item');
    return res.json();
}

export async function deleteItem(itemId: string) {
    const headers = await getHeaders();
    const res = await fetch(`${API_URL}items/${itemId}`, {
        method: 'DELETE',
        headers,
    });
    if (!res.ok) throw new Error('Failed to delete item');
    return res.json();
}

export async function listReports(limit: number = 20, nextToken?: string | null, search?: string): Promise<{ items: Report[], nextToken: string | null }> {
    const headers = await getHeaders();

    const params = new URLSearchParams();
    params.append('limit', limit.toString());
    if (nextToken) params.append('nextToken', nextToken);
    if (search) params.append('search', search);

    const res = await fetch(`${API_URL}reports?${params.toString()}`, { headers, cache: 'no-store' });
    if (!res.ok) throw new Error('Failed to fetch reports');
    return res.json();
}
