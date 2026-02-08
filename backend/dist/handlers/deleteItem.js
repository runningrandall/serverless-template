"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;
const item_1 = require("../entities/item");
const handler = async (event) => {
    try {
        const itemId = event.pathParameters?.itemId;
        if (!itemId) {
            return { statusCode: 400, body: JSON.stringify({ error: "Missing itemId" }) };
        }
        await item_1.ItemEntity.delete({ itemId }).go();
        return {
            statusCode: 200,
            headers: { "Access-Control-Allow-Origin": "*" },
            body: JSON.stringify({ message: "Item deleted" }),
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
