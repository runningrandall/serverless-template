"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.metrics = exports.tracer = exports.logger = void 0;
const logger_1 = require("@aws-lambda-powertools/logger");
const tracer_1 = require("@aws-lambda-powertools/tracer");
const metrics_1 = require("@aws-lambda-powertools/metrics");
const SERVICE_NAME = 'test-backend';
exports.logger = new logger_1.Logger({
    serviceName: SERVICE_NAME,
    logLevel: 'INFO',
});
exports.tracer = new tracer_1.Tracer({
    serviceName: SERVICE_NAME,
    captureHTTPsRequests: true,
});
exports.metrics = new metrics_1.Metrics({
    serviceName: SERVICE_NAME,
    namespace: 'Test',
});
