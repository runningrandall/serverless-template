# Serverless Template App

This project demonstrates a full-stack serverless architecture using:
- **Frontend**: Next.js 14 (App Router) + Tailwind CSS
- **Backend**: AWS Lambda (Node.js/TypeScript)
- **Database**: DynamoDB (Single Table Design with ElectroDB)
- **Infrastructure**: AWS CDK (TypeScript)

## structure

- `infra/`: CDK Infrastructure code
- `backend/`: Lambda functions and ElectroDB entities
- `frontend/`: Next.js application

## Prerequisites

- Node.js (v22+)
- AWS CLI configured with credentials (`aws configure`)
- AWS CDK Toolkit (`npm install -g aws-cdk`)
- pnpm (`npm install -g pnpm`)

## Getting Started

1. **Install Dependencies** (root level)
   ```bash
   pnpm install
   ```

2. **Deploy Infrastructure**
   ```bash
   make deploy
   # OR
   pnpm --filter infra run deploy
   ```
   
   **IMPORTANT**: Copy the `ApiUrl` from the deployment output (e.g., `https://xxxxxx.execute-api.us-east-1.amazonaws.com/prod/`).

3. **Configure Frontend**
   Create `frontend/.env.local`:
   ```bash
   NEXT_PUBLIC_API_URL=<your-api-url>
   ```

4.  **Run Frontend**
    ```bash
    pnpm dev
    ```
    Open [http://localhost:3000](http://localhost:3000).

## Deployment

To deploy the infrastructure to your AWS account from your local machine:

1.  **Authenticate**: Ensure you are logged in via AWS CLI (`aws sso login` or configure credentials).
2.  **Deploy**:
    ```bash
    pnpm deploy
    ```
    *   This command runs `cdk deploy` for the `infra` package.
    *   It uses your **local OS username** to create an ephemeral environment (e.g., `HmaasInfraStack-username`).
    *   This ensures your deployment does not conflict with other developers or the main branch.

## Local Development (Offline)

You can run the full stack (Database, API, Frontend) locally without deploying to AWS.

### Prerequisites
1.  **Docker**: Must be installed and running (for DynamoDB Local).
2.  **AWS SAM CLI**: Required to run Lambda functions locally (`brew install aws-sam-cli`).
3.  **Node.js**: v22+.

### Quick Start
To start the entire local environment in one go:

```bash
pnpm dev
```

This command will:
1.  Start DynamoDB Local (Docker container).
2.  Create the DynamoDB table (if it doesn't exist).
3.  Seed the database with sample data.
4.  Start the Backend API (via SAM Local) & Frontend (Next.js) in parallel.

### Access Points
- **Frontend**: [http://localhost:3000](http://localhost:3000)
- **Backend API**: [http://127.0.0.1:3000](http://127.0.0.1:3000)
- **DynamoDB Local**: [http://localhost:8000](http://localhost:8000)

### Manual Commands (Individual Steps)
If you prefer to run steps individually:
- `pnpm db:start`: Start DynamoDB Local.
- `pnpm db:init`: Create tables.
- `pnpm db:seed`: Seed data.
- `pnpm api:start`: Start Backend API.
- `pnpm dev:frontend`: Start Frontend only.

## Architecture Details

- **Single Table Design**: The `backend/src/entities/item.ts` defines the schema using ElectroDB.
- **Lambdas**: Located in `backend/src/handlers/`. They are bundled by CDK using `esbuild`.
- **API Gateway**: Defined in `infra/lib/infra-stack.ts`, integrates with Lambdas.
