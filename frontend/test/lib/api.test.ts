import { describe, it, expect, vi, beforeEach } from 'vitest';

// Use vi.hoisted for variables used in vi.mock factory
const { mockFetchAuthSession } = vi.hoisted(() => ({
    mockFetchAuthSession: vi.fn(),
}));

// Mock aws-amplify/auth
vi.mock('aws-amplify/auth', () => ({
    fetchAuthSession: mockFetchAuthSession,
}));

// Mock global fetch
const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

import { listReports, getReport } from '../../lib/api'; // Updated imports

describe('API client', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        // Default: no auth session
        mockFetchAuthSession.mockRejectedValue(new Error('No session'));
        vi.stubEnv('NEXT_PUBLIC_API_URL', 'http://localhost:3001/');
    });

    describe('listReports', () => {
        it('should fetch reports successfully', async () => {
            const mockReports = { items: [{ reportId: '1', description: 'Test' }], nextToken: null };
            mockFetch.mockResolvedValue({
                ok: true,
                json: () => Promise.resolve(mockReports),
            });

            const result = await listReports();

            expect(result).toEqual(mockReports);
            expect(mockFetch).toHaveBeenCalledWith(
                expect.stringContaining('reports'),
                expect.objectContaining({
                    headers: expect.objectContaining({
                        'Content-Type': 'application/json',
                    }),
                    cache: 'no-store',
                }),
            );
        });

        it('should throw on non-ok response', async () => {
            mockFetch.mockResolvedValue({ ok: false, status: 500 });
            await expect(listReports()).rejects.toThrow('Failed to fetch reports');
        });

        it('should include auth token when session exists', async () => {
            mockFetchAuthSession.mockResolvedValue({
                tokens: {
                    accessToken: { toString: () => 'test-token-123' },
                },
            });
            mockFetch.mockResolvedValue({
                ok: true,
                json: () => Promise.resolve({ items: [] }),
            });

            await listReports();

            expect(mockFetch).toHaveBeenCalledWith(
                expect.any(String),
                expect.objectContaining({
                    headers: expect.objectContaining({
                        Authorization: 'Bearer test-token-123',
                    }),
                }),
            );
        });
    });

    // Add createReport test if available in api.ts?
    // Based on previous code, createReport might be in a different file or inline?
    // Wait, api.ts only has listReports and getReport now, usually.
    // Let's check api.ts content if needed.
    // Assuming listReports and getReport are there.

    describe('getReport', () => {
        it('should fetch a single report', async () => {
            mockFetchAuthSession.mockResolvedValue({
                tokens: {
                    accessToken: { toString: () => 'test-token-123' },
                },
            });
            const mockReport = { reportId: '123', description: 'Detail' };
            mockFetch.mockResolvedValue({
                ok: true,
                json: () => Promise.resolve(mockReport),
            });

            const result = await getReport('123');
            expect(result).toEqual(mockReport);
            expect(mockFetch).toHaveBeenCalledWith(
                expect.stringContaining('reports/123'),
                expect.objectContaining({
                    headers: expect.objectContaining({
                        Authorization: 'Bearer test-token-123',
                    }),
                })
            );
        });
    });
});
