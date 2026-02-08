"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.client = void 0;
const client_dynamodb_1 = require("@aws-sdk/client-dynamodb");
// In a real app complexity this might need X-Ray or other config
exports.client = new client_dynamodb_1.DynamoDBClient({});
