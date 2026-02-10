import middy from '@middy/core';
import jsonBodyParser from '@middy/http-json-body-parser';
import httpHeaderNormalizer from '@middy/http-header-normalizer';
import httpErrorHandler from '@middy/http-error-handler';
import cors from '@middy/http-cors';
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';

export const commonMiddleware = (handler: (event: APIGatewayProxyEvent, context: any) => Promise<APIGatewayProxyResult>) => {
    return middy(handler)
        .use(httpHeaderNormalizer())
        .use(jsonBodyParser())
        .use(cors())
        .use(httpErrorHandler());
};
