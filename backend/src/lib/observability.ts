import { Logger } from '@aws-lambda-powertools/logger';
import { Tracer } from '@aws-lambda-powertools/tracer';
import { Metrics } from '@aws-lambda-powertools/metrics';

const SERVICE_NAME = 'hmaas-backend';

export const logger = new Logger({
    serviceName: SERVICE_NAME,
    logLevel: 'INFO',
});

export const tracer = new Tracer({
    serviceName: SERVICE_NAME,
    captureHTTPsRequests: true,
});

export const metrics = new Metrics({
    serviceName: SERVICE_NAME,
    namespace: 'Test',
});
