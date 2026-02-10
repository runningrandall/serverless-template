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

import { listItems, createItem, deleteItem } from '../../lib/api';

describe('API client', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        // Default: no auth session
        mockFetchAuthSession.mockRejectedValue(new Error('No session'));
    });

    describe('listItems', () => {
        it('should fetch items successfully', async () => {
            const mockItems = [{ itemId: '1', name: 'Test' }];
            mockFetch.mockResolvedValue({
                ok: true,
                json: () => Promise.resolve(mockItems),
            });

            const result = await listItems();

            expect(result).toEqual(mockItems);
            expect(mockFetch).toHaveBeenCalledWith(
                expect.stringContaining('items'),
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

            await expect(listItems()).rejects.toThrow('Failed to fetch items');
        });

        it('should include auth token when session exists', async () => {
            mockFetchAuthSession.mockResolvedValue({
                tokens: {
                    accessToken: { toString: () => 'test-token-123' },
                },
            });
            mockFetch.mockResolvedValue({
                ok: true,
                json: () => Promise.resolve([]),
            });

            await listItems();

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

    describe('createItem', () => {
        it('should create an item successfully', async () => {
            const newItem = { itemId: '2', name: 'New', description: 'Desc' };
            mockFetch.mockResolvedValue({
                ok: true,
                json: () => Promise.resolve(newItem),
            });

            const result = await createItem('New', 'Desc');

            expect(result).toEqual(newItem);
            expect(mockFetch).toHaveBeenCalledWith(
                expect.stringContaining('items'),
                expect.objectContaining({
                    method: 'POST',
                    body: JSON.stringify({ name: 'New', description: 'Desc' }),
                }),
            );
        });

        it('should throw on non-ok response', async () => {
            mockFetch.mockResolvedValue({ ok: false, status: 400 });

            await expect(createItem('Bad', 'Desc')).rejects.toThrow('Failed to create item');
        });
    });

    describe('deleteItem', () => {
        it('should delete an item successfully', async () => {
            mockFetch.mockResolvedValue({
                ok: true,
                json: () => Promise.resolve({ message: 'deleted' }),
            });

            const result = await deleteItem('item-123');

            expect(result).toEqual({ message: 'deleted' });
            expect(mockFetch).toHaveBeenCalledWith(
                expect.stringContaining('items/item-123'),
                expect.objectContaining({
                    method: 'DELETE',
                }),
            );
        });

        it('should throw on non-ok response', async () => {
            mockFetch.mockResolvedValue({ ok: false, status: 404 });

            await expect(deleteItem('bad-id')).rejects.toThrow('Failed to delete item');
        });
    });

    describe('getHeaders', () => {
        it('should not include auth header when session has no tokens', async () => {
            mockFetchAuthSession.mockResolvedValue({ tokens: null });
            mockFetch.mockResolvedValue({
                ok: true,
                json: () => Promise.resolve([]),
            });

            await listItems();

            const callHeaders = mockFetch.mock.calls[0][1].headers;
            expect(callHeaders.Authorization).toBeUndefined();
        });

        it('should not include auth header when session throws', async () => {
            mockFetchAuthSession.mockRejectedValue(new Error('No session'));
            mockFetch.mockResolvedValue({
                ok: true,
                json: () => Promise.resolve([]),
            });

            await listItems();

            const callHeaders = mockFetch.mock.calls[0][1].headers;
            expect(callHeaders.Authorization).toBeUndefined();
        });
    });
});
