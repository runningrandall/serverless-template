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
    status: string;
    dateObserved?: string;
    timeObserved?: string;
    locationDescription?: string;
    name?: string;
    email?: string;
    phone?: string;
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



export async function listReports(limit: number = 20, nextToken?: string | null, search?: string): Promise<{ items: Report[], nextToken: string | null }> {
    const headers = await getHeaders();

    const params = new URLSearchParams();
    params.append('limit', limit.toString());
    if (nextToken) params.append('nextToken', nextToken);
    if (search) params.append('search', search);

    const res = await fetch(`${API_URL}/reports?${params.toString()}`, { headers, cache: 'no-store' });
    if (!res.ok) throw new Error('Failed to fetch reports');
    return res.json();
}

export async function getReport(reportId: string): Promise<Report> {
    const headers = await getHeaders();
    const res = await fetch(`${API_URL}/reports/${reportId}`, { headers, cache: 'no-store' });
    if (!res.ok) {
        if (res.status === 404) throw new Error('Report not found');
        if (res.status === 403) throw new Error('Access denied');
        throw new Error('Failed to fetch report');
    }
    return res.json();
}
