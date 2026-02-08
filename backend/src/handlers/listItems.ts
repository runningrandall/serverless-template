import { APIGatewayProxyHandler } from "aws-lambda";
import { ItemEntity } from "../entities/item";

export const handler: APIGatewayProxyHandler = async (event) => {
    try {
        const result = await ItemEntity.scan.go();

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
