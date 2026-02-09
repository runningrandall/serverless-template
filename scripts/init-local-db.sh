#!/bin/bash

# Create the table in local DynamoDB
# We use the same name as the CDK stack creates (or a consistent one)
TABLE_NAME="serverless-template-table"

# Check if table exists
if aws dynamodb describe-table --table-name $TABLE_NAME --endpoint-url http://localhost:8000 --region us-east-1 > /dev/null 2>&1; then
    echo "Table $TABLE_NAME already exists."
else
    aws dynamodb create-table \
        --table-name $TABLE_NAME \
        --attribute-definitions AttributeName=pk,AttributeType=S AttributeName=sk,AttributeType=S \
        --key-schema AttributeName=pk,KeyType=HASH AttributeName=sk,KeyType=RANGE \
        --billing-mode PAY_PER_REQUEST \
        --endpoint-url http://localhost:8000 \
        --region us-east-1
    echo "Table $TABLE_NAME created in local DynamoDB"
fi
