"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;
const client_dynamodb_1 = require("@aws-sdk/client-dynamodb");
const dynamodb = new client_dynamodb_1.DynamoDBClient({});
const TABLE_NAME = process.env.TABLE_NAME;
// Reference data to seed into the table on stack creation/update
const SEED_DATA = [
    {
        pk: { S: '$template-service#categoryid_maintenance' },
        sk: { S: '$category_1' },
        categoryId: { S: 'maintenance' },
        name: { S: 'General Maintenance' },
        description: { S: 'Regular home maintenance tasks' },
        createdAt: { N: String(Date.now()) },
        __edb_e__: { S: 'category' },
        __edb_v__: { S: '1' },
    },
    {
        pk: { S: '$template-service#categoryid_plumbing' },
        sk: { S: '$category_1' },
        categoryId: { S: 'plumbing' },
        name: { S: 'Plumbing' },
        description: { S: 'Plumbing repairs and installations' },
        createdAt: { N: String(Date.now()) },
        __edb_e__: { S: 'category' },
        __edb_v__: { S: '1' },
    },
    {
        pk: { S: '$template-service#categoryid_electrical' },
        sk: { S: '$category_1' },
        categoryId: { S: 'electrical' },
        name: { S: 'Electrical' },
        description: { S: 'Electrical repairs and installations' },
        createdAt: { N: String(Date.now()) },
        __edb_e__: { S: 'category' },
        __edb_v__: { S: '1' },
    },
    {
        pk: { S: '$template-service#categoryid_hvac' },
        sk: { S: '$category_1' },
        categoryId: { S: 'hvac' },
        name: { S: 'HVAC' },
        description: { S: 'Heating, ventilation, and air conditioning' },
        createdAt: { N: String(Date.now()) },
        __edb_e__: { S: 'category' },
        __edb_v__: { S: '1' },
    },
    {
        pk: { S: '$template-service#categoryid_landscaping' },
        sk: { S: '$category_1' },
        categoryId: { S: 'landscaping' },
        name: { S: 'Landscaping' },
        description: { S: 'Lawn care, tree trimming, and garden maintenance' },
        createdAt: { N: String(Date.now()) },
        __edb_e__: { S: 'category' },
        __edb_v__: { S: '1' },
    },
];
const handler = async (event, context) => {
    console.log('Seed handler invoked', JSON.stringify(event));
    const responseUrl = event.ResponseURL;
    const responseBody = {
        Status: 'SUCCESS',
        Reason: `See CloudWatch Log Stream: ${context.logStreamName}`,
        PhysicalResourceId: context.logStreamName,
        StackId: event.StackId,
        RequestId: event.RequestId,
        LogicalResourceId: event.LogicalResourceId,
        Data: {},
    };
    try {
        if (event.RequestType === 'Create' || event.RequestType === 'Update') {
            console.log(`Seeding ${SEED_DATA.length} items into ${TABLE_NAME}`);
            for (const item of SEED_DATA) {
                await dynamodb.send(new client_dynamodb_1.PutItemCommand({
                    TableName: TABLE_NAME,
                    Item: item,
                    ConditionExpression: 'attribute_not_exists(pk)', // Don't overwrite existing data
                })).catch((err) => {
                    if (err.name === 'ConditionalCheckFailedException') {
                        console.log(`Item ${item.pk.S} already exists, skipping.`);
                    }
                    else {
                        throw err;
                    }
                });
            }
            responseBody.Data = { SeededCount: SEED_DATA.length };
            console.log('Seeding complete.');
        }
        if (event.RequestType === 'Delete') {
            console.log('Delete request — no action needed for seed data.');
        }
    }
    catch (error) {
        console.error('Seed handler error:', error);
        responseBody.Status = 'FAILED';
        responseBody.Reason = error.message;
    }
    // Send response to CloudFormation
    const response = await fetch(responseUrl, {
        method: 'PUT',
        body: JSON.stringify(responseBody),
        headers: { 'Content-Type': '' },
    });
    console.log(`CloudFormation response status: ${response.status}`);
    return;
};
exports.handler = handler;
