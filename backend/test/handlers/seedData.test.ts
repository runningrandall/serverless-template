import { vi, describe, it, expect, beforeEach } from 'vitest';
import { handler } from '../../src/handlers/seedData';

// Mock DynamoDB client
vi.mock('@aws-sdk/client-dynamodb', () => {
    const mockSend = vi.fn();
    return {
        DynamoDBClient: vi.fn(() => ({ send: mockSend })),
        PutItemCommand: vi.fn((params: any) => ({ input: params })),
        ScanCommand: vi.fn(),
        __mockSend: mockSend, // export for test access
    };
});

// Mock fetch for CloudFormation response
const mockFetch = vi.fn().mockResolvedValue({ status: 200 });
vi.stubGlobal('fetch', mockFetch);

const { __mockSend: mockSend } = await import('@aws-sdk/client-dynamodb') as any;

const makeEvent = (requestType: string) => ({
    RequestType: requestType,
    ServiceToken: 'arn:aws:lambda:us-east-1:123456789:function:seed',
    ResponseURL: 'https://cloudformation-custom-resource-response.s3.amazonaws.com/test',
    StackId: 'arn:aws:cloudformation:us-east-1:123456789:stack/test/guid',
    RequestId: 'test-request-id',
    ResourceType: 'Custom::SeedData',
    LogicalResourceId: 'SeedDataResource',
    ResourceProperties: {
        ServiceToken: 'arn:aws:lambda:us-east-1:123456789:function:seed',
        Version: '1',
    },
});

const makeContext = () => ({
    logStreamName: 'test-log-stream',
    callbackWaitsForEmptyEventLoop: true,
    functionName: 'seed',
    functionVersion: '$LATEST',
    invokedFunctionArn: 'arn:aws:lambda:us-east-1:123456789:function:seed',
    memoryLimitInMB: '128',
    awsRequestId: 'test-request-id',
    logGroupName: '/aws/lambda/seed',
    getRemainingTimeInMillis: () => 30000,
    done: vi.fn(),
    fail: vi.fn(),
    succeed: vi.fn(),
});

describe('seedData handler', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockFetch.mockResolvedValue({ status: 200 });
    });

    it('should seed data on Create event', async () => {
        mockSend.mockResolvedValue({});

        await handler(makeEvent('Create') as any, makeContext() as any);

        // Should have called PutItem for each seed item (3 items)
        expect(mockSend).toHaveBeenCalledTimes(3);

        // Should have sent SUCCESS response to CloudFormation
        expect(mockFetch).toHaveBeenCalledTimes(1);
        const fetchCall = mockFetch.mock.calls[0];
        expect(fetchCall[0]).toBe('https://cloudformation-custom-resource-response.s3.amazonaws.com/test');
        const responseBody = JSON.parse(fetchCall[1].body);
        expect(responseBody.Status).toBe('SUCCESS');
    });

    it('should seed data on Update event', async () => {
        mockSend.mockResolvedValue({});

        await handler(makeEvent('Update') as any, makeContext() as any);

        expect(mockSend).toHaveBeenCalledTimes(3);

        const responseBody = JSON.parse(mockFetch.mock.calls[0][1].body);
        expect(responseBody.Status).toBe('SUCCESS');
    });

    it('should skip existing items without failing', async () => {
        const conditionalError = new Error('Condition not met');
        (conditionalError as any).name = 'ConditionalCheckFailedException';
        mockSend.mockRejectedValue(conditionalError);

        await handler(makeEvent('Create') as any, makeContext() as any);

        // Should still succeed — ConditionalCheckFailedException is caught
        const responseBody = JSON.parse(mockFetch.mock.calls[0][1].body);
        expect(responseBody.Status).toBe('SUCCESS');
    });

    it('should handle Delete event with no action', async () => {
        await handler(makeEvent('Delete') as any, makeContext() as any);

        // Should not call DynamoDB at all
        expect(mockSend).not.toHaveBeenCalled();

        // Should still respond SUCCESS to CloudFormation
        const responseBody = JSON.parse(mockFetch.mock.calls[0][1].body);
        expect(responseBody.Status).toBe('SUCCESS');
    });

    it('should report FAILED status on unexpected error', async () => {
        mockSend.mockRejectedValue(new Error('Access Denied'));

        await handler(makeEvent('Create') as any, makeContext() as any);

        const responseBody = JSON.parse(mockFetch.mock.calls[0][1].body);
        expect(responseBody.Status).toBe('FAILED');
        expect(responseBody.Reason).toBe('Access Denied');
    });
});
