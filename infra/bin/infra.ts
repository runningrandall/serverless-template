#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib/core';
import * as dotenv from 'dotenv';
import { InfraStack } from '../lib/infra-stack';
import { AuthStack } from '../lib/auth-stack';
import { FrontendStack } from '../lib/frontend-stack';
import { AwsSolutionsChecks } from 'cdk-nag';

import * as os from 'os';
import * as path from 'path';

// Load environment variables from .env file
dotenv.config({ path: path.join(__dirname, '../../.env') });

const app = new cdk.App();

// Apply cdk-nag security checks
cdk.Aspects.of(app).add(new AwsSolutionsChecks({ verbose: true }));

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
const appName = process.env.APP_NAME || 'Test';
console.log(`Deploying ${appName} to stage: ${stageName}`);

// Apply cost allocation and resource tags
cdk.Tags.of(app).add('Project', appName);
cdk.Tags.of(app).add('Stage', stageName);
cdk.Tags.of(app).add('ManagedBy', 'CDK');

// Frontend Stack - Persistent (one per account/region ideally, or managed here)
// We might want to deploy this only once or have it be a singleton.
// For simplicity, let's name it without stage name so it persists across stages?
// OR we just deploy it every time.
const frontendStack = new FrontendStack(app, `${appName}FrontendStack`, {
  env
});

const authStack = new AuthStack(app, `${appName}AuthStack-${stageName}`, {
  env,
  stageName
});

new InfraStack(app, `${appName}InfraStack-${stageName}`, {
  env,
  auth: authStack,
  stageName
});
