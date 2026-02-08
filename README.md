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

4. **Run Frontend**
   ```bash
   make dev
   # OR
   pnpm --filter frontend run dev
   ```
   Open [http://localhost:3000](http://localhost:3000).

## Architecture Details

- **Single Table Design**: The `backend/src/entities/item.ts` defines the schema using ElectroDB.
- **Lambdas**: Located in `backend/src/handlers/`. They are bundled by CDK using `esbuild`.
- **API Gateway**: Defined in `infra/lib/infra-stack.ts`, integrates with Lambdas.
