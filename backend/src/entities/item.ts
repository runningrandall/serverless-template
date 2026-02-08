import { Entity } from "electrodb";
import { client } from "../clients/dynamodb";

const table = process.env.TABLE_NAME || "serverless-template-table";

export const ItemEntity = new Entity(
    {
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
    },
    { client, table }
);
