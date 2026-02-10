/**
 * Integration test setup for local DynamoDB.
 *
 * Creates a fresh test table before each suite and tears it down after.
 * Requires DynamoDB Local to be running on port 8000:
 *   pnpm db:start
 */
import { DynamoDBClient, CreateTableCommand, DeleteTableCommand, DescribeTableCommand } from "@aws-sdk/client-dynamodb";
import { beforeAll, afterAll } from "vitest";

const TEST_TABLE = "integration-test-table";
const ENDPOINT = "http://localhost:8000";
const REGION = "us-east-1";

// Override environment variables for the integration test
process.env.TABLE_NAME = TEST_TABLE;
process.env.LOCAL_DYNAMODB_ENDPOINT = ENDPOINT;
process.env.AWS_REGION = REGION;
process.env.AWS_ACCESS_KEY_ID = "test";
process.env.AWS_SECRET_ACCESS_KEY = "test";

const adminClient = new DynamoDBClient({
    endpoint: ENDPOINT,
    region: REGION,
    credentials: {
        accessKeyId: "test",
        secretAccessKey: "test",
    },
});

export async function createTestTable() {
    try {
        await adminClient.send(new DescribeTableCommand({ TableName: TEST_TABLE }));
        // Table exists — delete and recreate for a clean slate
        await adminClient.send(new DeleteTableCommand({ TableName: TEST_TABLE }));
    } catch (e: any) {
        if (e.name !== "ResourceNotFoundException") throw e;
    }

    await adminClient.send(new CreateTableCommand({
        TableName: TEST_TABLE,
        AttributeDefinitions: [
            { AttributeName: "pk", AttributeType: "S" },
            { AttributeName: "sk", AttributeType: "S" },
        ],
        KeySchema: [
            { AttributeName: "pk", KeyType: "HASH" },
            { AttributeName: "sk", KeyType: "RANGE" },
        ],
        BillingMode: "PAY_PER_REQUEST",
    }));
}

export async function deleteTestTable() {
    try {
        await adminClient.send(new DeleteTableCommand({ TableName: TEST_TABLE }));
    } catch {
        // Ignore if table doesn't exist
    }
}

/**
 * Call this in your integration test file to set up the table lifecycle.
 */
export function setupDynamoTestTable() {
    beforeAll(async () => {
        await createTestTable();
    }, 15_000);

    afterAll(async () => {
        await deleteTestTable();
    }, 10_000);
}
