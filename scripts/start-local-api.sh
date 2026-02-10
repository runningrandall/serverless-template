#!/bin/bash

# Synth the template (needed for SAM)
pnpm --filter infra run synth

# Start API Gateway locally
# connecting to local DDB via host networking or special DNS
# For Docker on Mac/Windows, host.docker.internal resolves to host machine


# Generate env.json from current environment variables
# We use node to create the JSON file safely
node -e '
  const fs = require("fs");
  const env = {
    "InfraStack": {
      "TABLE_NAME": process.env.TABLE_NAME,
      "LOCAL_DYNAMODB_ENDPOINT": process.env.LOCAL_DYNAMODB_ENDPOINT,
      "AWS_REGION": process.env.AWS_REGION
    }
  };
  fs.writeFileSync("env.json", JSON.stringify(env, null, 2));
'

sam local start-api \
    -t infra/cdk.out/InfraStack.template.json \
    --warm-containers EAGER \
    --env-vars env.json \
    --docker-network host 
    # Network host might need adjustment depending on OS/Docker setup, 
    # often accessing host.docker.internal works better for Mac

# Clean up env.json after run (optional, but good practice)
# rm env.json

