# Serverless Full-Stack Template

A production-ready, full-stack serverless template built with modern best practices. Clone it, customize it, and ship.

## Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | Next.js 16 (App Router), Tailwind CSS, shadcn/ui |
| **Backend** | AWS Lambda (Node.js 22, TypeScript), Middy Middleware |
| **Database** | DynamoDB (Single Table Design via ElectroDB) |
| **Auth** | Amazon Cognito + Amazon Verified Permissions (Cedar) |
| **Infrastructure** | AWS CDK (TypeScript), 3 stacks |
| **CI/CD** | GitHub Actions |
| **Observability** | AWS Powertools (Logger, Tracer), CloudWatch Dashboard |
| **Testing** | Vitest (unit), Cypress (E2E + a11y), Jest (infra) |
| **Docs** | Storybook 10, OpenAPI (Swagger UI) |

## Project Structure

```
├── backend/                 # Lambda handlers, entities, middleware
│   ├── src/
│   │   ├── auth/            # Lambda authorizer (Cognito + Cedar)
│   │   ├── entities/        # ElectroDB entity definitions
│   │   ├── handlers/        # API Lambda handlers
│   │   └── lib/             # Shared: middleware, error, observability, schemas, OpenAPI
│   └── test/                # Vitest unit tests
├── frontend/                # Next.js application
│   ├── app/                 # Pages: home, admin, api-docs, login, profile
│   ├── components/          # React components (shadcn/ui)
│   ├── cypress/             # E2E & accessibility tests
│   ├── stories/             # Storybook stories
│   └── .storybook/          # Storybook configuration
├── infra/                   # AWS CDK infrastructure
│   ├── bin/infra.ts         # CDK app entry point (cdk-nag enabled)
│   └── lib/
│       ├── auth-stack.ts    # Cognito User Pool, Verified Permissions
│       ├── frontend-stack.ts# S3 + CloudFront (prod/non-prod)
│       └── infra-stack.ts   # API GW, Lambda, DynamoDB, EventBridge, Dashboard
├── scripts/                 # Local dev: DB start, init, seed, API start
├── templates/               # Plop code generators
├── .github/workflows/       # CI/CD pipeline
├── .husky/                  # Git hooks (pre-commit lint, pre-push test)
└── plopfile.js              # Code scaffolding configuration
```

## Prerequisites

- **Node.js** v22+
- **pnpm** (`npm install -g pnpm`)
- **AWS CLI** configured with credentials (`aws configure`)
- **AWS CDK** (`npm install -g aws-cdk`)
- **Docker** (for DynamoDB Local)
- **AWS SAM CLI** (for local Lambda, `brew install aws-sam-cli`)

## Getting Started

```bash
# 1. Install dependencies
pnpm install

# 2. Deploy to AWS (uses your OS username as stage name)
pnpm deploy

# 3. Configure frontend
echo "NEXT_PUBLIC_API_URL=<your-api-url-from-deploy-output>" > frontend/.env.local

# 4. Start frontend
pnpm dev
```

## Local Development

Run the full stack locally without AWS:

```bash
pnpm dev           # Start frontend (Next.js dev server)
pnpm db:start      # Start DynamoDB Local (Docker)
pnpm db:init       # Create tables
pnpm db:seed       # Seed sample data
pnpm api:start     # Start backend API (SAM Local)
pnpm dev:backend   # Watch-mode backend + local API
```

| Service | URL |
|---|---|
| Frontend | http://localhost:3000 |
| Backend API | http://127.0.0.1:3001 |
| DynamoDB Local | http://localhost:8000 |

---

## Features

### 🔧 Backend Middleware (Middy)

All Lambda handlers use a shared `commonMiddleware()` that bundles:
- **JSON body parsing** — auto-parses `application/json` request bodies
- **Header normalization** — case-insensitive header access
- **CORS** — centralized cross-origin configuration
- **Error handling** — catches thrown errors and returns structured responses

```typescript
// backend/src/handlers/myHandler.ts
import { commonMiddleware } from "../lib/middleware";
import { AppError } from "../lib/error";

const baseHandler = async (event, context) => {
    if (!event.pathParameters?.id) {
        throw new AppError("Missing id", 400);
    }
    // ... handler logic (no try/catch needed)
};

export const handler = commonMiddleware(baseHandler);
```

### 📊 CloudWatch Dashboard

Automatically deployed with your stack. Includes:
- **API Gateway**: Request count, 4xx/5xx errors, latency percentiles (p50, p90, p99)
- **Lambda**: Invocations, errors, and duration for all functions
- **DynamoDB**: Consumed read/write capacity, throttle events

Find it in the AWS Console under **CloudWatch → Dashboards → `<stage>-ServiceDashboard`**.

### 🔒 Security (cdk-nag)

[cdk-nag](https://github.com/cdklabs/cdk-nag) runs `AwsSolutionsChecks` during every `cdk synth`. It scans your infrastructure for security and compliance issues. Template-acceptable suppressions are documented inline in `infra-stack.ts`.

### 🔐 Authentication & Authorization

- **Amazon Cognito** User Pool with email sign-up
- **Amazon Verified Permissions** (Cedar policies) for fine-grained RBAC
- **Lambda Token Authorizer** validates JWTs and checks Cedar policies per request
- Pre-configured `admin` and `user` roles

### 📡 Event-Driven Messaging

- **Amazon EventBridge** bus (`HmaasEventBus-<stage>`)
- `ItemCreated` events published on item creation
- `processEvent` Lambda listens and processes events
- Extensible: add new rules and listeners easily

### 🗄️ Database Seeding (Custom Resource)

Reference data is automatically seeded into DynamoDB on stack creation/update via a CloudFormation Custom Resource. Edit the seed data in `backend/src/handlers/seedData.ts`. Bump the `Version` property in `infra-stack.ts` to trigger re-seeding.

### 📝 Runtime Validation (Zod)

Request bodies are validated using [Zod](https://zod.dev/) schemas defined in `backend/src/lib/schemas.ts`. Schemas are also used to generate the OpenAPI spec.

### 📖 API Documentation (OpenAPI)

- Schemas registered via `@asteasolutions/zod-to-openapi` in `backend/src/lib/openapi.ts`
- Generate spec: `pnpm --filter backend gen:docs`
- View at: `/api-docs` page in the frontend (Swagger UI)
- CI pipeline auto-generates and deploys the spec

### 📚 Storybook

Component development and documentation with Storybook 10:
```bash
pnpm --filter frontend storybook        # Dev server
pnpm --filter frontend build-storybook  # Static build
```

### 🧪 Testing

| Type | Tool | Command |
|---|---|---|
| Backend Unit | Vitest | `pnpm --filter backend test` |
| Infra Snapshot | Jest | `pnpm --filter infra test` |
| E2E + a11y | Cypress + cypress-axe | `pnpm --filter frontend test:e2e` |
| All | — | `pnpm test` |

### 🏗️ Code Scaffolding (Plop)

Generate new endpoints and components with consistent patterns:

```bash
pnpm generate
# Select: endpoint → creates handler + test
# Select: component → creates component + barrel export + Storybook story
```

Templates are in `templates/endpoint/` and `templates/component/`.

### 🪝 Git Hooks

| Hook | Action |
|---|---|
| **pre-commit** | Runs `lint-staged` (ESLint --fix on staged `.ts`/`.tsx` files) |
| **pre-push** | Runs `pnpm test` (all workspace tests must pass) |

#### Conventional Commits
Use `pnpm commit` for interactive, conventional commit messages (powered by [Commitizen](https://github.com/commitizen/cz-cli)).

### 🚀 CI/CD (GitHub Actions)

The `deploy.yml` workflow runs on pull requests to `main`:

1. **Install** dependencies
2. **Unit tests** (`pnpm test`)
3. **Lint** frontend
4. **E2E tests** (Cypress)
5. **Deploy infra** (`cdk deploy`)
6. **Generate API docs** and copy to frontend
7. **Build & deploy frontend** to S3/CloudFront
   - `main` → prod bucket
   - Feature branches → non-prod bucket under `/<branch-name>/`

### 🖥️ Frontend Features

- **Next.js 16** with App Router and static export
- **Tailwind CSS** + **shadcn/ui** components
- **Admin Dashboard** (`/admin`)
- **Login / Profile** pages
- **CloudFront** distribution with security headers
- **Prod / Non-Prod split** — separate S3 buckets and CloudFront distributions

### 📐 Observability (AWS Powertools)

All Lambda handlers include:
- **Structured JSON logging** via `@aws-lambda-powertools/logger`
- **Distributed tracing** via `@aws-lambda-powertools/tracer` (X-Ray)

---

## Available Scripts

| Script | Description |
|---|---|
| `pnpm dev` | Start Next.js dev server |
| `pnpm build` | Build all workspaces |
| `pnpm test` | Run all tests |
| `pnpm deploy` | Deploy infrastructure to AWS |
| `pnpm generate` | Scaffold new endpoint or component |
| `pnpm commit` | Interactive conventional commit |
| `pnpm db:start` | Start DynamoDB Local |
| `pnpm db:init` | Create DynamoDB tables |
| `pnpm db:seed` | Seed local database |
| `pnpm api:start` | Start local API (SAM) |

## Deployment

```bash
# Deploy from local machine (creates ephemeral stack named after your username)
pnpm deploy

# Or via CI — push a PR to main
```

The CDK app creates three stacks:
- **`AuthStack-<stage>`** — Cognito + Verified Permissions
- **`InfraStack-<stage>`** — API Gateway, Lambda, DynamoDB, EventBridge, CloudWatch Dashboard
- **`FrontendStack`** — S3 + CloudFront (shared across stages)
