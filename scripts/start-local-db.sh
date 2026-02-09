#!/bin/bash

# Start DynamoDB Local in Docker
if [ ! "$(docker ps -q -f name=dynamo-local)" ]; then
    if [ "$(docker ps -aq -f status=exited -f name=dynamo-local)" ]; then
        # Cleanup exited container
        docker rm dynamo-local
    fi
    docker run -d -p 8000:8000 --name dynamo-local amazon/dynamodb-local
    echo "DynamoDB Local started on port 8000"
else
    echo "DynamoDB Local is already running."
fi
