import { APIGatewayProxyResult } from "aws-lambda";
import { ZodError } from "zod";
import { logger } from "./observability";

/**
 * Shared error response shape returned by all API endpoints.
 * Consumers can rely on this consistent structure.
 */
export interface ErrorResponse {
    error: {
        code: string;
        message: string;
        details?: unknown;
        requestId?: string;
    };
}

/**
 * Application error with HTTP status code and error code.
 */
export class AppError extends Error {
    public readonly statusCode: number;
    public readonly code: string;

    constructor(message: string, statusCode: number = 500, code?: string) {
        super(message);
        this.statusCode = statusCode;
        this.code = code || statusCodeToErrorCode(statusCode);
        this.name = 'AppError';
    }
}

/**
 * Maps an HTTP status code to a default error code string.
 */
function statusCodeToErrorCode(statusCode: number): string {
    const codeMap: Record<number, string> = {
        400: 'BAD_REQUEST',
        401: 'UNAUTHORIZED',
        403: 'FORBIDDEN',
        404: 'NOT_FOUND',
        409: 'CONFLICT',
        422: 'UNPROCESSABLE_ENTITY',
        429: 'TOO_MANY_REQUESTS',
        500: 'INTERNAL_SERVER_ERROR',
        502: 'BAD_GATEWAY',
        503: 'SERVICE_UNAVAILABLE',
    };
    return codeMap[statusCode] || 'INTERNAL_SERVER_ERROR';
}

/**
 * Builds a consistent ErrorResponse JSON body.
 */
function buildErrorResponse(
    code: string,
    message: string,
    details?: unknown,
    requestId?: string
): ErrorResponse {
    const response: ErrorResponse = {
        error: {
            code,
            message,
        },
    };
    if (details !== undefined) {
        response.error.details = details;
    }
    if (requestId) {
        response.error.requestId = requestId;
    }
    return response;
}

/**
 * Maps any thrown error to a consistent API Gateway proxy result.
 * Use this in your handler's catch block or as middleware.
 */
export function mapErrorToResponse(error: unknown, requestId?: string): APIGatewayProxyResult {
    // Known application errors
    if (error instanceof AppError) {
        return {
            statusCode: error.statusCode,
            body: JSON.stringify(
                buildErrorResponse(error.code, error.message, undefined, requestId)
            ),
        };
    }

    // Zod validation errors
    if (error instanceof ZodError) {
        const details = error.issues.map(issue => ({
            path: issue.path.join('.'),
            message: issue.message,
        }));
        return {
            statusCode: 400,
            body: JSON.stringify(
                buildErrorResponse('VALIDATION_ERROR', 'Validation failed', details, requestId)
            ),
        };
    }

    // Unknown / unexpected errors — don't leak internals
    const message = error instanceof Error ? error.message : 'An unexpected error occurred';
    logger.error("Unhandled error", { error });

    return {
        statusCode: 500,
        body: JSON.stringify(
            buildErrorResponse('INTERNAL_SERVER_ERROR', message, undefined, requestId)
        ),
    };
}

/**
 * Convenience helper: validates Zod parse result and throws AppError on failure.
 */
export function validateOrThrow<T>(parseResult: { success: boolean; data?: T; error?: ZodError }): T {
    if (!parseResult.success) {
        const zodError = (parseResult as any).error as ZodError;
        const details = zodError.issues.map(issue => ({
            path: issue.path.join('.'),
            message: issue.message,
        }));
        throw new AppError(
            'Validation failed',
            400,
            'VALIDATION_ERROR'
        );
    }
    return (parseResult as any).data as T;
}
