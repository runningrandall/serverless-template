# Test Service CI/CD Pipelines

We use **GitHub Actions** for Continuous Integration and Continuous Deployment. Workflows are defined in `.github/workflows/`.

## Workflows

### 1. `deploy.yml` (Production & Staging)
Triggers on: **Push to `main`** or **Pull Request**.

**Jobs:**
1.  **Test & Coverage**: Runs unit tests (Backend, Infra), Linting, and E2E tests.
2.  **Cost Estimate**: Runs Infracost to estimate monthly spend impact.
3.  **Deploy**:
    - Deploys Infrastructure (`cdk deploy`).
    - Builds and Deploys Frontend to S3/CloudFront.
    - Generates & Publishes API Docs.

**Ephemeral Environments:**
- Every Pull Request gets a unique, isolated environment.
- Stack Name: `TestInfraStack-<stage_name>` (where stage is sanitized branch name).
- URL is posted back to the PR.

### 2. `teardown.yml` (Cleanup)
Triggers on: **Pull Request Closed** (Merge or Close).

**Jobs:**
1.  **Teardown**:
    - Identifies the stage name from the branch.
    - Destroys the CloudFormation stacks.
    - Cleans up the S3 deployment folder.

## Environment Variables / Secrets

Required GitHub Secrets:
- `AWS_ACCESS_KEY_ID`: Deployer credentials.
- `AWS_SECRET_ACCESS_KEY`: Deployer secret.
- `INFRACOST_API_KEY`: For cost estimation job.

## Branching Strategy
- **`main`**: Production environment.
- **Feature Branches**: Ephemeral / Staging environments.

## Deployment Logic (`infra/bin/infra.ts`)
The CDK app determines the `stageName` dynamically:
- In CI: derived from `GITHUB_HEAD_REF`.
- Locally: derived from OS `USERNAME`.
