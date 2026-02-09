#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib/core';
import { InfraStack } from '../lib/infra-stack';
import { AuthStack } from '../lib/auth-stack';

import * as os from 'os';

const app = new cdk.App();

// Define env to be used for both stacks
const env = { account: process.env.CDK_DEFAULT_ACCOUNT, region: process.env.CDK_DEFAULT_REGION };

const getStageName = (): string => {
  // 1. CI: GITHUB_HEAD_REF (PR) or GITHUB_REF_NAME (Push)
  // GITHUB_HEAD_REF is set only on pull_request events
  const branchName = process.env.GITHUB_HEAD_REF || process.env.GITHUB_REF_NAME;
  if (branchName) {
    // Sanitize: allow only alphanumeric
    return branchName.replace(/[^a-zA-Z0-9]/g, '');
  }
  // 2. Local: USERNAME or os.userInfo().username
  const username = process.env.USERNAME || os.userInfo().username;
  return username.replace(/[^a-zA-Z0-9]/g, '');
};

const stageName = getStageName();
console.log(`Deploying to stage: ${stageName}`);

const authStack = new AuthStack(app, `HmaasAuthStack-${stageName}`, {
  env,
  stageName
});

new InfraStack(app, `HmaasInfraStack-${stageName}`, {
  env,
  auth: authStack,
  stageName
});
