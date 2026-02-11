"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CategoryEntity = void 0;
const electrodb_1 = require("electrodb");
const dynamodb_1 = require("../clients/dynamodb");
const table = process.env.TABLE_NAME || "serverless-template-table";
exports.CategoryEntity = new electrodb_1.Entity({
    model: {
        entity: "category",
        version: "1",
        service: "template-service",
    },
    attributes: {
        categoryId: {
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
        byCategoryId: {
            pk: {
                field: "pk",
                composite: ["categoryId"],
            },
            sk: {
                field: "sk",
                composite: [],
            },
        },
    },
}, { client: dynamodb_1.client, table });
