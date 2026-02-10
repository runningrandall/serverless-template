import middy from '@middy/core';
import jsonBodyParser from '@middy/http-json-body-parser';
import httpHeaderNormalizer from '@middy/http-header-normalizer';
import cors from '@middy/http-cors';
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { logMetrics } from '@aws-lambda-powertools/metrics/middleware';
import { metrics } from './observability';
import { mapErrorToResponse } from './error';

/**
 * Custom middy error handler that maps all errors through the centralized
 * error mapper to produce consistent ErrorResponse shapes.
 */
const errorHandlerMiddleware = (): middy.MiddlewareObj<APIGatewayProxyEvent, APIGatewayProxyResult> => ({
    onError: async (request) => {
        const requestId = request.event?.requestContext?.requestId;
        request.response = mapErrorToResponse(request.error, requestId);
    },
});

export const commonMiddleware = (handler: (event: APIGatewayProxyEvent, context: any) => Promise<APIGatewayProxyResult>) => {
    return middy(handler)
        .use(httpHeaderNormalizer())
        .use(jsonBodyParser())
        .use(cors())
        .use(logMetrics(metrics, { captureColdStartMetric: true }))
        .use(errorHandlerMiddleware());
};
