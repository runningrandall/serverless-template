import { Entity } from "electrodb";
import { client } from "../clients/dynamodb";

const table = process.env.TABLE_NAME || "serverless-template-table";

export const CategoryEntity = new Entity(
    {
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
    },
    { client, table }
);
