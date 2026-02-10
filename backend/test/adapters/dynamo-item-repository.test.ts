import { vi, describe, it, expect, beforeEach } from 'vitest';
import { DynamoItemRepository } from '../../src/adapters/dynamo-item-repository';
import { Item } from '../../src/domain/item';

// Mock the DBService
const mockCreate = vi.fn();
const mockGet = vi.fn();
const mockScanGo = vi.fn();
const mockDelete = vi.fn();

vi.mock('../../src/entities/service', () => ({
    DBService: {
        entities: {
            item: {
                create: (...args: any[]) => ({ go: () => mockCreate(...args) }),
                get: (...args: any[]) => ({ go: () => mockGet(...args) }),
                scan: { go: (opts: any) => mockScanGo(opts) },
                delete: (...args: any[]) => ({ go: () => mockDelete(...args) }),
            },
        },
    },
}));

describe('DynamoItemRepository', () => {
    let repo: DynamoItemRepository;

    const sampleItem: Item = {
        itemId: 'item-123',
        name: 'Test Item',
        description: 'A test item',
        createdAt: '2024-01-01T00:00:00Z',
    };

    beforeEach(() => {
        vi.clearAllMocks();
        repo = new DynamoItemRepository();
    });

    describe('create', () => {
        it('should create an item and return validated result', async () => {
            mockCreate.mockResolvedValue({ data: sampleItem });

            const result = await repo.create(sampleItem);

            expect(mockCreate).toHaveBeenCalledWith(sampleItem);
            expect(result).toEqual(sampleItem);
        });

        it('should coerce numeric createdAt to string', async () => {
            mockCreate.mockResolvedValue({
                data: { ...sampleItem, createdAt: 1704067200000 },
            });

            const result = await repo.create(sampleItem);

            expect(result.createdAt).toBe('1704067200000');
        });

        it('should throw on invalid data from DynamoDB', async () => {
            mockCreate.mockResolvedValue({
                data: { itemId: 'x' }, // missing required 'name'
            });

            await expect(repo.create(sampleItem)).rejects.toThrow('Data integrity error');
        });
    });

    describe('get', () => {
        it('should return an item when found', async () => {
            mockGet.mockResolvedValue({ data: sampleItem });

            const result = await repo.get('item-123');

            expect(mockGet).toHaveBeenCalledWith({ itemId: 'item-123' });
            expect(result).toEqual(sampleItem);
        });

        it('should return null when item not found', async () => {
            mockGet.mockResolvedValue({ data: null });

            const result = await repo.get('non-existent');

            expect(result).toBeNull();
        });

        it('should validate data from DynamoDB', async () => {
            mockGet.mockResolvedValue({
                data: { itemId: 'x' }, // missing required 'name'
            });

            await expect(repo.get('x')).rejects.toThrow('Data integrity error');
        });
    });

    describe('list', () => {
        it('should return paginated items with default page size', async () => {
            mockScanGo.mockResolvedValue({
                data: [sampleItem],
                cursor: null,
            });

            const result = await repo.list();

            expect(mockScanGo).toHaveBeenCalledWith({ limit: 20 });
            expect(result.items).toEqual([sampleItem]);
            expect(result.cursor).toBeNull();
        });

        it('should pass custom limit and cursor', async () => {
            mockScanGo.mockResolvedValue({
                data: [sampleItem],
                cursor: 'next-page-cursor',
            });

            const result = await repo.list({ limit: 5, cursor: 'prev-cursor' });

            expect(mockScanGo).toHaveBeenCalledWith({
                limit: 5,
                cursor: 'prev-cursor',
            });
            expect(result.cursor).toBe('next-page-cursor');
        });

        it('should return empty items with null cursor when no results', async () => {
            mockScanGo.mockResolvedValue({ data: [], cursor: null });

            const result = await repo.list();

            expect(result.items).toEqual([]);
            expect(result.cursor).toBeNull();
        });

        it('should validate each item in the list', async () => {
            mockScanGo.mockResolvedValue({
                data: [sampleItem, { itemId: 'bad' }], // second item invalid
                cursor: null,
            });

            await expect(repo.list()).rejects.toThrow('Data integrity error');
        });
    });

    describe('delete', () => {
        it('should call delete with the correct itemId', async () => {
            mockDelete.mockResolvedValue({});

            await repo.delete('item-123');

            expect(mockDelete).toHaveBeenCalledWith({ itemId: 'item-123' });
        });
    });
});
