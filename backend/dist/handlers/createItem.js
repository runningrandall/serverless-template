"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;
const item_1 = require("../entities/item");
const handler = async (event) => {
    try {
        if (!event.body) {
            return { statusCode: 400, body: JSON.stringify({ error: "Missing body" }) };
        }
        const body = JSON.parse(event.body);
        const result = await item_1.ItemEntity.create(body).go();
        return {
            statusCode: 201,
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
