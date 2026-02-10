import { CloudFormationCustomResourceEvent, Context } from 'aws-lambda';
import { DynamoDBClient, PutItemCommand, ScanCommand } from '@aws-sdk/client-dynamodb';

const dynamodb = new DynamoDBClient({});
const TABLE_NAME = process.env.TABLE_NAME!;

// Reference data to seed into the table on stack creation/update
const SEED_DATA = [
    {
        pk: { S: '$category#maintenance' },
        sk: { S: '$category#maintenance' },
        name: { S: 'General Maintenance' },
        description: { S: 'Regular home maintenance tasks' },
        __edb_e__: { S: 'Category' },
        __edb_v__: { S: '1' },
    },
    {
        pk: { S: '$category#plumbing' },
        sk: { S: '$category#plumbing' },
        name: { S: 'Plumbing' },
        description: { S: 'Plumbing repairs and installations' },
        __edb_e__: { S: 'Category' },
        __edb_v__: { S: '1' },
    },
    {
        pk: { S: '$category#electrical' },
        sk: { S: '$category#electrical' },
        name: { S: 'Electrical' },
        description: { S: 'Electrical repairs and installations' },
        __edb_e__: { S: 'Category' },
        __edb_v__: { S: '1' },
    },
];

export const handler = async (event: CloudFormationCustomResourceEvent, context: Context) => {
    console.log('Seed handler invoked', JSON.stringify(event));

    const responseUrl = event.ResponseURL;
    const responseBody: Record<string, any> = {
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
                await dynamodb.send(new PutItemCommand({
                    TableName: TABLE_NAME,
                    Item: item,
                    ConditionExpression: 'attribute_not_exists(pk)', // Don't overwrite existing data
                })).catch((err) => {
                    if (err.name === 'ConditionalCheckFailedException') {
                        console.log(`Item ${item.pk.S} already exists, skipping.`);
                    } else {
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
    } catch (error: any) {
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
