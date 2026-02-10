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
| **Observability** | AWS Powertools (Logger, Tracer, Metrics), CloudWatch Dashboard |
| **Security** | WAF, cdk-nag, Lambda Authorizer |
| **Testing** | Vitest (unit), Cypress (E2E + a11y), Jest (infra), Integration tests |
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
│   ├── bin/infra.ts         # CDK app entry point (cdk-nag + tags)
│   └── lib/
│       ├── auth-stack.ts    # Cognito User Pool, Verified Permissions
│       ├── frontend-stack.ts# S3 + CloudFront (prod/non-prod)
│       └── infra-stack.ts   # API GW, Lambda, DynamoDB, EventBridge, WAF, Alarms, Dashboard
├── scripts/                 # Local dev + integration tests
├── templates/               # Plop code generators
├── .github/workflows/       # CI/CD pipeline
└── .husky/                  # Git hooks (pre-commit lint, pre-push test)
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

# 2. Copy environment variables
cp .env.example .env

# 3. Deploy to AWS (uses your OS username as stage name)
pnpm deploy

# 4. Configure frontend
echo "NEXT_PUBLIC_API_URL=<your-api-url-from-deploy-output>" > frontend/.env.local

# 5. Start frontend
pnpm dev
```

## Local Development

Run the full stack locally without AWS:

```bash
pnpm dev           # Start frontend (Next.js dev server)
pnpm db:start      # Start DynamoDB Local (Docker)
pnpm db:init       # Create tables
pnpm db:seed       # Seed sample data
pnpm api:start     # Start local API (SAM)
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
- **Metrics** — auto-flushes Powertools Metrics (including cold start tracking)
- **Error handling** — catches thrown errors and returns structured responses

```typescript
import { commonMiddleware } from "../lib/middleware";
import { AppError } from "../lib/error";

const baseHandler = async (event, context) => {
    if (!event.pathParameters?.id) throw new AppError("Missing id", 400);
    // ... handler logic (no try/catch needed)
};

export const handler = commonMiddleware(baseHandler);
```

### 📊 CloudWatch Dashboard

Automatically deployed with your stack. Includes:
- **API Gateway**: Request count, 4xx/5xx errors, latency percentiles (p50, p90, p99)
- **Lambda**: Invocations, errors, and duration for all functions
- **DynamoDB**: Consumed read/write capacity, throttle events
- **Dead Letter Queue**: Messages visible, messages sent
- **WAF**: Blocked requests

Find it at **CloudWatch → Dashboards → `<stage>-ServiceDashboard`**.

### � CloudWatch Alarms + SNS

Automated alerting for production issues:

| Alarm | Threshold | Description |
|---|---|---|
| API 5xx Errors | ≥ 5 in 10 min | Server-side errors detected |
| API Latency | p99 > 3s for 15 min | High latency spike |
| Lambda Errors | ≥ 3 per function in 10 min | Individual function failures |
| DynamoDB Throttle | ≥ 1 event in 10 min | Read throttle events |
| DLQ Messages | ≥ 1 message | Lambda failures sent to DLQ |

Subscribe to alerts:
```bash
aws sns subscribe --topic-arn <AlarmTopicArn from deploy output> --protocol email --notification-endpoint your@email.com
```

### 💀 Dead Letter Queues (DLQ)

All Lambda functions and EventBridge rules are configured with a shared SQS Dead Letter Queue. Failed invocations are captured for debugging instead of being silently lost. The DLQ retains messages for 14 days.

### 🛡️ WAF (Web Application Firewall)

API Gateway is protected by AWS WAFv2 with:
- **Rate limiting**: 1,000 requests per 5 minutes per IP
- **AWS Common Rule Set**: Blocks known malicious inputs (XSS, SQLi, etc.)
- **Known Bad Inputs**: Blocks requests matching known attack signatures

### 📈 API Gateway Usage Plans

Built-in throttling and quotas:
- **Rate**: 100 requests/second
- **Burst**: 200 requests
- **Daily Quota**: 10,000 requests

### 📏 Powertools Metrics

Custom CloudWatch Metrics via `@aws-lambda-powertools/metrics`:
- **Cold Start** tracking (automatic via middleware)
- **Custom business metrics**: `ItemsCreated`, `ValidationErrors`, `EventPublishErrors`
- Metrics published to the `Hmaas` CloudWatch namespace

```typescript
import { metrics } from "../lib/observability";
import { MetricUnit } from "@aws-lambda-powertools/metrics";

metrics.addMetric('ItemsCreated', MetricUnit.Count, 1);
```

### 🔒 Security (cdk-nag)

[cdk-nag](https://github.com/cdklabs/cdk-nag) runs `AwsSolutionsChecks` during every `cdk synth`. All suppressions are documented with justifications in `infra-stack.ts`.

### 🔐 Authentication & Authorization

- **Amazon Cognito** User Pool with email sign-up
- **Amazon Verified Permissions** (Cedar policies) for fine-grained RBAC
- **Lambda Token Authorizer** validates JWTs and checks Cedar policies per request

### 📡 Event-Driven Messaging

- **Amazon EventBridge** bus with `ItemCreated` events
- `processEvent` Lambda listener
- EventBridge rule deadLetterQueue for failed deliveries

### 🗄️ Database Seeding (Custom Resource)

Reference data auto-seeded on stack deploy. Edit seed data in `backend/src/handlers/seedData.ts`.

### 📝 Runtime Validation (Zod)

Request bodies validated using Zod schemas in `backend/src/lib/schemas.ts`.

### 📖 API Documentation (OpenAPI)

Generate spec: `pnpm --filter backend gen:docs` — view at `/api-docs` in the frontend.

### 📚 Storybook

```bash
pnpm --filter frontend storybook        # Dev server
pnpm --filter frontend build-storybook  # Static build
```

### 🏷️ Resource Tagging

All resources are automatically tagged via CDK:

| Tag | Value |
|---|---|
| `Project` | App name (default: `Hmaas`) |
| `Stage` | Stage name (branch or username) |
| `ManagedBy` | `CDK` |

### 🧪 Testing

| Type | Tool | Command |
|---|---|---|
| Backend Unit | Vitest | `pnpm --filter backend test` |
| Infra Snapshot | Jest | `pnpm --filter infra test` |
| E2E + a11y | Cypress | `pnpm --filter frontend test:e2e` |
| Integration | Node.js | `API_URL=<url> pnpm test:integration` |
| All Unit | — | `pnpm test` |

### 🏗️ Code Scaffolding (Plop)

```bash
pnpm generate
# endpoint → handler + test
# component → React component + barrel export + Storybook story
```

### 🪝 Git Hooks

| Hook | Action |
|---|---|
| **pre-commit** | `lint-staged` (ESLint --fix on `.ts`/`.tsx`) |
| **pre-push** | `pnpm test` (all tests must pass) |

Use `pnpm commit` for interactive conventional commits.

### 🚀 CI/CD (GitHub Actions)

On PRs to `main`: Install → Test → Lint → E2E → Deploy Infra → Build & Deploy Frontend to S3/CloudFront.

### 🖥️ Frontend

- **Next.js 16** with App Router and static export
- **Tailwind CSS** + **shadcn/ui** components
- **Admin Dashboard**, Login, Profile pages
- **CloudFront** with prod/non-prod split

---

## Available Scripts

| Script | Description |
|---|---|
| `pnpm dev` | Start Next.js dev server |
| `pnpm build` | Build all workspaces |
| `pnpm test` | Run all unit tests |
| `pnpm test:integration` | Run integration tests against deployed API |
| `pnpm deploy` | Deploy infrastructure to AWS |
| `pnpm generate` | Scaffold new endpoint or component |
| `pnpm commit` | Interactive conventional commit |
| `pnpm db:start` | Start DynamoDB Local |
| `pnpm db:init` | Create DynamoDB tables |
| `pnpm db:seed` | Seed local database |
| `pnpm api:start` | Start local API (SAM) |

## Deployment

```bash
pnpm deploy  # Ephemeral stack named after your username
```

Three CDK stacks:
- **`AuthStack-<stage>`** — Cognito + Verified Permissions
- **`InfraStack-<stage>`** — API Gateway, Lambda, DynamoDB, EventBridge, WAF, Alarms, Dashboard
- **`FrontendStack`** — S3 + CloudFront (shared)

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## License

[MIT](LICENSE)
