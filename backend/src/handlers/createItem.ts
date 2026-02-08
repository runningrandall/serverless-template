import { APIGatewayProxyHandler } from "aws-lambda";
import { ItemEntity } from "../entities/item";

export const handler: APIGatewayProxyHandler = async (event) => {
    try {
        if (!event.body) {
            return { statusCode: 400, body: JSON.stringify({ error: "Missing body" }) };
        }

        const body = JSON.parse(event.body);
        const result = await ItemEntity.create(body).go();

        return {
            statusCode: 201,
            headers: { "Access-Control-Allow-Origin": "*" },
            body: JSON.stringify(result.data),
        };
    } catch (error: any) {
        console.error(error);
        return {
            statusCode: 500,
            headers: { "Access-Control-Allow-Origin": "*" },
            body: JSON.stringify({ error: error.message }),
        };
    }
};
