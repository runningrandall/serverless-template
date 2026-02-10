import { vi, describe, it, expect, beforeEach } from 'vitest';
import { handler } from '../../src/handlers/processEvent';

describe('processEvent handler', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should process an ItemCreated event', async () => {
        const event = {
            version: '0',
            id: 'test-id',
            source: 'hmaas.api',
            account: '123456789',
            time: '2024-01-01T00:00:00Z',
            region: 'us-east-1',
            resources: [],
            'detail-type': 'ItemCreated',
            detail: {
                itemId: '123',
                name: 'Test Item',
            },
        };

        const result = await handler(event as any);
        expect(result).toBeUndefined();
    });

    it('should handle non-ItemCreated events', async () => {
        const event = {
            version: '0',
            id: 'test-id',
            source: 'hmaas.api',
            account: '123456789',
            time: '2024-01-01T00:00:00Z',
            region: 'us-east-1',
            resources: [],
            'detail-type': 'SomeOtherEvent',
            detail: {
                data: 'something',
            },
        };

        const result = await handler(event as any);
        expect(result).toBeUndefined();
    });
});
