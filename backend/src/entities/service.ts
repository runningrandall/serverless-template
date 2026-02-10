import { Service } from "electrodb";
import { ItemEntity } from "./item";
import { CategoryEntity } from "./category";
import { client } from "../clients/dynamodb";

export const DBService = new Service(
    {
        item: ItemEntity,
        category: CategoryEntity,
    },
    { client, table: process.env.TABLE_NAME || "serverless-template-table" }
);
