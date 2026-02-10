import { Service } from "electrodb";
import { ItemEntity } from "./item";
import { client } from "../clients/dynamodb";

export const DBService = new Service(
    {
        item: ItemEntity,
    },
    { client, table: process.env.TABLE_NAME || "serverless-template-table" }
);
