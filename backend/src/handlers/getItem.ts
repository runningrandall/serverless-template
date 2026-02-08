import { APIGatewayProxyHandler } from "aws-lambda";
import { ItemEntity } from "../entities/item";

export const handler: APIGatewayProxyHandler = async (event) => {
    try {
        const itemId = event.pathParameters?.itemId;
        if (!itemId) {
            return { statusCode: 400, body: JSON.stringify({ error: "Missing itemId" }) };
        }

        const result = await ItemEntity.get({ itemId }).go();

        if (!result.data) {
            return { statusCode: 404, body: JSON.stringify({ error: "Item not found" }) };
        }

        return {
            statusCode: 200,
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
