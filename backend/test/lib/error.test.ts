import { describe, it, expect, vi } from 'vitest';
import { AppError, mapErrorToResponse, ErrorResponse } from '../../src/lib/error';
import { ZodError, ZodIssueCode } from 'zod';

// Mock logger
vi.mock('../../src/lib/observability', () => ({
    logger: {
        error: vi.fn(),
        warn: vi.fn(),
        info: vi.fn(),
    },
}));

describe('AppError', () => {
    it('should default to 500 and INTERNAL_SERVER_ERROR', () => {
        const err = new AppError('Something broke');
        expect(err.statusCode).toBe(500);
        expect(err.code).toBe('INTERNAL_SERVER_ERROR');
        expect(err.message).toBe('Something broke');
    });

    it('should auto-derive code from status code', () => {
        expect(new AppError('Not found', 404).code).toBe('NOT_FOUND');
        expect(new AppError('Bad input', 400).code).toBe('BAD_REQUEST');
        expect(new AppError('Unauthorized', 401).code).toBe('UNAUTHORIZED');
        expect(new AppError('Forbidden', 403).code).toBe('FORBIDDEN');
        expect(new AppError('Rate limited', 429).code).toBe('TOO_MANY_REQUESTS');
    });

    it('should allow custom code override', () => {
        const err = new AppError('Duplicate', 409, 'DUPLICATE_ITEM');
        expect(err.code).toBe('DUPLICATE_ITEM');
    });
});

describe('mapErrorToResponse', () => {
    it('should map AppError to correct response', () => {
        const err = new AppError('Item not found', 404);
        const result = mapErrorToResponse(err, 'req-123');

        expect(result.statusCode).toBe(404);
        const body: ErrorResponse = JSON.parse(result.body);
        expect(body.error.code).toBe('NOT_FOUND');
        expect(body.error.message).toBe('Item not found');
        expect(body.error.requestId).toBe('req-123');
    });

    it('should map ZodError to 400 with field-level details', () => {
        const zodError = new ZodError([
            {
                code: ZodIssueCode.invalid_type,
                expected: 'string',
                received: 'undefined',
                path: ['name'],
                message: 'Required',
            },
            {
                code: ZodIssueCode.too_small,
                minimum: 1,
                inclusive: true,
                type: 'string',
                path: ['description'],
                message: 'Too short',
            },
        ]);

        const result = mapErrorToResponse(zodError);

        expect(result.statusCode).toBe(400);
        const body: ErrorResponse = JSON.parse(result.body);
        expect(body.error.code).toBe('VALIDATION_ERROR');
        expect(body.error.message).toBe('Validation failed');
        expect(body.error.details).toEqual([
            { path: 'name', message: 'Required' },
            { path: 'description', message: 'Too short' },
        ]);
    });

    it('should map unknown errors to 500 without leaking details', () => {
        const result = mapErrorToResponse(new Error('db connection failed'));

        expect(result.statusCode).toBe(500);
        const body: ErrorResponse = JSON.parse(result.body);
        expect(body.error.code).toBe('INTERNAL_SERVER_ERROR');
        expect(body.error.message).toBe('db connection failed');
    });

    it('should handle non-Error thrown values', () => {
        const result = mapErrorToResponse('string error');

        expect(result.statusCode).toBe(500);
        const body: ErrorResponse = JSON.parse(result.body);
        expect(body.error.code).toBe('INTERNAL_SERVER_ERROR');
    });

    it('should include requestId when provided', () => {
        const result = mapErrorToResponse(new AppError('fail', 500), 'abc-def');
        const body: ErrorResponse = JSON.parse(result.body);
        expect(body.error.requestId).toBe('abc-def');
    });

    it('should omit requestId when not provided', () => {
        const result = mapErrorToResponse(new AppError('fail', 500));
        const body: ErrorResponse = JSON.parse(result.body);
        expect(body.error.requestId).toBeUndefined();
    });
});
