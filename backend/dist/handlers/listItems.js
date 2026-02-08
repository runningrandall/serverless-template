"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;
const item_1 = require("../entities/item");
const handler = async (event) => {
    try {
        const result = await item_1.ItemEntity.scan.go();
        return {
            statusCode: 200,
            headers: { "Access-Control-Allow-Origin": "*" },
            body: JSON.stringify(result.data),
        };
    }
    catch (error) {
        console.error(error);
        return {
            statusCode: 500,
            headers: { "Access-Control-Allow-Origin": "*" },
            body: JSON.stringify({ error: error.message }),
        };
    }
};
exports.handler = handler;
