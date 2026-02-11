"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.commonMiddleware = void 0;
const core_1 = __importDefault(require("@middy/core"));
const http_json_body_parser_1 = __importDefault(require("@middy/http-json-body-parser"));
const http_header_normalizer_1 = __importDefault(require("@middy/http-header-normalizer"));
const http_cors_1 = __importDefault(require("@middy/http-cors"));
const middleware_1 = require("@aws-lambda-powertools/metrics/middleware");
const observability_1 = require("./observability");
const error_1 = require("./error");
/**
 * Custom middy error handler that maps all errors through the centralized
 * error mapper to produce consistent ErrorResponse shapes.
 */
const errorHandlerMiddleware = () => ({
    onError: async (request) => {
        const requestId = request.event?.requestContext?.requestId;
        request.response = (0, error_1.mapErrorToResponse)(request.error, requestId);
    },
});
const commonMiddleware = (handler) => {
    return (0, core_1.default)(handler)
        .use((0, http_header_normalizer_1.default)())
        .use((0, http_json_body_parser_1.default)())
        .use((0, http_cors_1.default)())
        .use((0, middleware_1.logMetrics)(observability_1.metrics, { captureColdStartMetric: true }))
        .use(errorHandlerMiddleware());
};
exports.commonMiddleware = commonMiddleware;
