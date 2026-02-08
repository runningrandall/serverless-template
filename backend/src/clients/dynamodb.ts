import { DynamoDBClient } from "@aws-sdk/client-dynamodb";

// In a real app complexity this might need X-Ray or other config
export const client = new DynamoDBClient({});
