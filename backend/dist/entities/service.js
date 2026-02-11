"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DBService = void 0;
const electrodb_1 = require("electrodb");
const item_1 = require("./item");
const category_1 = require("./category");
const dynamodb_1 = require("../clients/dynamodb");
exports.DBService = new electrodb_1.Service({
    item: item_1.ItemEntity,
    category: category_1.CategoryEntity,
}, { client: dynamodb_1.client, table: process.env.TABLE_NAME || "serverless-template-table" });
