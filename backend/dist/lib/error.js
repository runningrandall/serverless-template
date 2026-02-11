"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateOrThrow = exports.mapErrorToResponse = exports.AppError = void 0;
const zod_1 = require("zod");
const observability_1 = require("./observability");
/**
 * Application error with HTTP status code and error code.
 */
class AppError extends Error {
    statusCode;
    code;
    details;
    constructor(message, statusCode = 500, code, details) {
        super(message);
        this.statusCode = statusCode;
        this.code = code || statusCodeToErrorCode(statusCode);
        this.name = 'AppError';
        this.details = details;
    }
}
exports.AppError = AppError;
/**
 * Maps an HTTP status code to a default error code string.
 */
function statusCodeToErrorCode(statusCode) {
    const codeMap = {
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
function buildErrorResponse(code, message, details, requestId) {
    const response = {
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
function mapErrorToResponse(error, requestId) {
    // Known application errors
    if (error instanceof AppError) {
        return {
            statusCode: error.statusCode,
            body: JSON.stringify(buildErrorResponse(error.code, error.message, error.details, requestId)),
        };
    }
    // Zod validation errors
    if (error instanceof zod_1.ZodError) {
        const details = error.issues.map(issue => ({
            path: issue.path.join('.'),
            message: issue.message,
        }));
        return {
            statusCode: 400,
            body: JSON.stringify(buildErrorResponse('VALIDATION_ERROR', 'Validation failed', details, requestId)),
        };
    }
    // Unknown / unexpected errors — don't leak internals
    const message = error instanceof Error ? error.message : 'An unexpected error occurred';
    observability_1.logger.error("Unhandled error", { error });
    return {
        statusCode: 500,
        body: JSON.stringify(buildErrorResponse('INTERNAL_SERVER_ERROR', message, undefined, requestId)),
    };
}
exports.mapErrorToResponse = mapErrorToResponse;
/**
 * Convenience helper: validates Zod parse result and throws AppError on failure.
 */
function validateOrThrow(parseResult) {
    if (!parseResult.success) {
        const zodError = parseResult.error;
        const details = zodError.issues.map(issue => ({
            path: issue.path.join('.'),
            message: issue.message,
        }));
        throw new AppError('Validation failed', 400, 'VALIDATION_ERROR', details);
    }
    return parseResult.data;
}
exports.validateOrThrow = validateOrThrow;
