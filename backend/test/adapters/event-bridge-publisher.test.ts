import { vi, describe, it, expect, beforeEach } from 'vitest';
import { EventBridgePublisher } from '../../src/adapters/event-bridge-publisher';

// Mock EventBridge client
const mockSend = vi.fn();
vi.mock('@aws-sdk/client-eventbridge', () => ({
    EventBridgeClient: vi.fn().mockImplementation(() => ({
        send: mockSend,
    })),
    PutEventsCommand: vi.fn().mockImplementation((input: any) => input),
}));

// Mock tracer to pass through the client
vi.mock('../../src/lib/observability', () => ({
    tracer: { captureAWSv3Client: (c: any) => c },
    logger: {
        info: vi.fn(),
        warn: vi.fn(),
        error: vi.fn(),
    },
}));

describe('EventBridgePublisher', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should publish an event to EventBridge', async () => {
        mockSend.mockResolvedValue({});
        const publisher = new EventBridgePublisher('test-bus');

        await publisher.publish('ItemCreated', { itemId: '123', name: 'Test' });

        expect(mockSend).toHaveBeenCalledTimes(1);
        expect(mockSend).toHaveBeenCalledWith(expect.objectContaining({
            Entries: [{
                Source: 'hmaas.api',
                DetailType: 'ItemCreated',
                Detail: JSON.stringify({ itemId: '123', name: 'Test' }),
                EventBusName: 'test-bus',
            }],
        }));
    });

    it('should skip publishing when busName is empty', async () => {
        const publisher = new EventBridgePublisher('');

        await publisher.publish('ItemCreated', { itemId: '123' });

        expect(mockSend).not.toHaveBeenCalled();
    });

    it('should not throw when EventBridge send fails', async () => {
        mockSend.mockRejectedValue(new Error('EventBridge error'));
        const publisher = new EventBridgePublisher('test-bus');

        // Should not throw — error is logged but swallowed
        await expect(publisher.publish('ItemCreated', { itemId: '123' })).resolves.toBeUndefined();
    });
});
