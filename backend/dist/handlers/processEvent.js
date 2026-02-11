"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;
const observability_1 = require("../lib/observability");
const handler = async (event) => {
    observability_1.logger.info("Received EventBridge Event", { event });
    // Logic to process event
    if (event.source !== 'test.api') {
        observability_1.logger.warn("Received event from unexpected source", { source: event.source });
        return;
    }
    if (event["detail-type"] === "ItemCreated") {
        observability_1.logger.info("Processing ItemCreated event", { itemId: event.detail.itemId });
    }
    return;
};
exports.handler = handler;
