"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ItemEntity = void 0;
const electrodb_1 = require("electrodb");
const dynamodb_1 = require("../clients/dynamodb");
const table = process.env.TABLE_NAME || "serverless-template-table";
exports.ItemEntity = new electrodb_1.Entity({
    model: {
        entity: "item",
        version: "1",
        service: "template-service",
    },
    attributes: {
        itemId: {
            type: "string",
            required: true,
        },
        name: {
            type: "string",
            required: true,
        },
        description: {
            type: "string",
        },
        createdAt: {
            type: "number",
            default: () => Date.now(),
            readOnly: true,
        },
        updatedAt: {
            type: "number",
            watch: "*",
            set: () => Date.now(),
            readOnly: true,
        },
    },
    indexes: {
        byItemId: {
            pk: {
                field: "pk",
                composite: ["itemId"],
            },
            sk: {
                field: "sk",
                composite: [],
            },
        },
    },
}, { client: dynamodb_1.client, table });
