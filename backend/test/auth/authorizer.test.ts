import { vi, describe, it, expect, beforeEach } from 'vitest';

// Use vi.hoisted so mocks are available before vi.mock hoisting
const { mockVerify, mockAVPSend } = vi.hoisted(() => ({
    mockVerify: vi.fn(),
    mockAVPSend: vi.fn(),
}));

vi.mock('aws-jwt-verify', () => ({
    CognitoJwtVerifier: {
        create: vi.fn(() => ({
            verify: mockVerify,
        })),
    },
}));

vi.mock('@aws-sdk/client-verifiedpermissions', () => ({
    VerifiedPermissionsClient: vi.fn(() => ({ send: mockAVPSend })),
    IsAuthorizedCommand: vi.fn((params: any) => params),
}));

import { handler } from '../../src/auth/authorizer';

const makeEvent = (overrides: Record<string, any> = {}) => ({
    type: 'TOKEN',
    authorizationToken: 'Bearer test-jwt-token',
    methodArn: 'arn:aws:execute-api:us-east-1:123456789:apiid/stage/GET/items',
    ...overrides,
});

describe('authorizer handler', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should allow access when AVP returns ALLOW for GET', async () => {
        mockVerify.mockResolvedValue({
            sub: 'user-123',
            'cognito:groups': ['admin'],
        });
        mockAVPSend.mockResolvedValue({ decision: 'ALLOW' });

        const event = makeEvent();
        const result = await handler(event as any);

        expect(result.principalId).toBe('user-123');
        expect(result.policyDocument.Statement[0].Effect).toBe('Allow');
    });

    it('should deny access when AVP returns DENY', async () => {
        mockVerify.mockResolvedValue({
            sub: 'user-456',
            'cognito:groups': ['user'],
        });
        mockAVPSend.mockResolvedValue({ decision: 'DENY' });

        const event = makeEvent();
        const result = await handler(event as any);

        expect(result.principalId).toBe('user-456');
        expect(result.policyDocument.Statement[0].Effect).toBe('Deny');
    });

    it('should map POST to ManageUsers action', async () => {
        mockVerify.mockResolvedValue({
            sub: 'user-789',
            'cognito:groups': ['admin'],
        });
        mockAVPSend.mockResolvedValue({ decision: 'ALLOW' });

        const event = makeEvent({
            methodArn: 'arn:aws:execute-api:us-east-1:123456789:apiid/stage/POST/items',
        });

        const result = await handler(event as any);
        expect(result.principalId).toBe('user-789');

        // Verify the AVP command was called with ManageUsers action
        const avpCall = mockAVPSend.mock.calls[0][0];
        expect(avpCall.action.actionId).toBe('ManageUsers');
    });

    it('should map GET to ReadDashboard action', async () => {
        mockVerify.mockResolvedValue({
            sub: 'user-123',
            'cognito:groups': [],
        });
        mockAVPSend.mockResolvedValue({ decision: 'ALLOW' });

        const event = makeEvent({
            methodArn: 'arn:aws:execute-api:us-east-1:123456789:apiid/stage/GET/items/123',
        });

        await handler(event as any);

        const avpCall = mockAVPSend.mock.calls[0][0];
        expect(avpCall.action.actionId).toBe('ReadDashboard');
    });

    it('should handle users with no groups', async () => {
        mockVerify.mockResolvedValue({
            sub: 'user-no-groups',
            // No cognito:groups in payload
        });
        mockAVPSend.mockResolvedValue({ decision: 'ALLOW' });

        const event = makeEvent();
        const result = await handler(event as any);

        expect(result.principalId).toBe('user-no-groups');
        expect(result.policyDocument.Statement[0].Effect).toBe('Allow');

        // Should pass empty groups array
        const avpCall = mockAVPSend.mock.calls[0][0];
        expect(avpCall.entities.entityList[0].attributes.groups.set).toEqual([]);
    });

    it('should throw Unauthorized on invalid token', async () => {
        mockVerify.mockRejectedValue(new Error('Token expired'));

        const event = makeEvent();

        await expect(handler(event as any)).rejects.toThrow('Unauthorized');
    });

    it('should throw Unauthorized on AVP client error', async () => {
        mockVerify.mockResolvedValue({
            sub: 'user-123',
            'cognito:groups': ['admin'],
        });
        mockAVPSend.mockRejectedValue(new Error('AVP service error'));

        const event = makeEvent();

        await expect(handler(event as any)).rejects.toThrow('Unauthorized');
    });
});
