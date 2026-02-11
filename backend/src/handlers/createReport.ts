import { APIGatewayProxyHandler } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand } from '@aws-sdk/lib-dynamodb';
import { randomUUID } from 'crypto';

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

const TABLE_NAME = process.env.REPORTS_TABLE || '';

export const handler: APIGatewayProxyHandler = async (event) => {
    console.log('Received event:', JSON.stringify(event, null, 2));

    try {
        const body = JSON.parse(event.body || '{}');
        const { name, contact, concernType, description, dateObserved, timeObserved, location, imageKeys, captchaToken } = body;

        if (!name || !concernType || !location || !imageKeys || imageKeys.length === 0) {
            return {
                statusCode: 400,
                headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
                body: JSON.stringify({ message: 'Missing required fields: name, concernType, location, imageKeys' }),
            };
        }

        // TODO: Verify captchaToken server-side via Google reCAPTCHA API
        if (captchaToken) {
            console.log('CAPTCHA token received, server-side verification pending');
        }

        const reportId = randomUUID();
        const createdAt = new Date().toISOString();

        const item = {
            reportId,
            createdAt,
            name,
            contact,
            concernType,
            description: description || '',
            dateObserved: dateObserved || '',
            timeObserved: timeObserved || '',
            location, // { lat: number, lng: number }
            imageKeys, // string[]
            status: 'NEW',
        };

        await docClient.send(new PutCommand({
            TableName: TABLE_NAME,
            Item: item,
        }));

        return {
            statusCode: 201,
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
            body: JSON.stringify({ message: 'Report created', reportId }),
        };
    } catch (error) {
        console.error('Error creating report:', error);
        return {
            statusCode: 500,
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
            body: JSON.stringify({ message: 'Internal Server Error' }),
        };
    }
};
