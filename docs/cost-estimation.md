# Cost Estimation

This project integrates [Infracost](https://www.infracost.io/) to provide cost visibility directly in Pull Requests.

## How it Works
1.  **Synth**: The CI job runs `cdk synth` to generate CloudFormation templates.
2.  **Analyze**: Infracost parses the templates and estimates monthly costs based on AWS pricing.
3.  **Report**: A comment is posted on the Pull Request showing the breakdown.

## Setup
1.  Get a free API key from [Infracost.io](https://www.infracost.io/).
2.  Add it to GitHub Secrets as `INFRACOST_API_KEY`.

## What it Covers
- Lambda (invocations, duration)
- API Gateway (requests)
- DynamoDB (storage, WCU/RCU)
- CloudWatch (logs, metrics)
- WAF (rules, requests)
- Data Transfer

> **Note**: Serverless costs are usage-based. Infracost estimates usually assume a baseline (or zero) usage unless usage files are provided. It effectively shows "fixed" costs + unit prices.
