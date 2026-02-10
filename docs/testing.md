# Testing Strategy

We employ a multi-layered testing strategy to ensure reliability from unit to production.

| Type | Scope | Tool | Location | Command |
|---|---|---|---|---|
| **Unit (Backend)** | Lambda Handlers, Logic | Vitest | `backend/test` | `pnpm --filter backend test` |
| **Unit (Frontend)** | Components, Hooks | Vitest | `frontend/test` | `pnpm --filter frontend test` |
| **Infrastructure** | CDK Stack Snapshots | Jest | `infra/test` | `pnpm --filter infra test` |
| **E2E** | Full Browser Flow | Cypress | `frontend/cypress` | `pnpm --filter frontend test:e2e` |
| **Integration** | Live API Smoke Tests | Node.js | `scripts/` | `pnpm test:integration` |

## 1. Unit Testing

### Backend (Vitest)
Tests individual Lambda handlers and utility functions.
- **Mocking**: AWS SDKs are mocked using `vi.mock`.
- **Coverage**: Run `pnpm --filter backend test:coverage`.

### Frontend (Vitest + React Testing Library)
Tests React components and hooks in isolation.
- **Environment**: JSDOM.
- **Mocking**: API calls (`lib/api.ts`) are mocked.
- **Coverage**: Run `pnpm --filter frontend test:coverage`.

## 2. Infrastructure Testing (Jest)
Tests the AWS CDK code itself.
- **Fine-grained assertions**: Checks that specific resources (DynamoDB tables, Lambdas) are created with correct properties.
- **Snapshot testing**: Ensures no accidental changes to the CloudFormation template.

## 3. End-to-End (E2E) Testing (Cypress)
Tests the running application in a real browser.
- **Headless**: Runs in CI via GitHub Actions.
- **Interactive**: `pnpm --filter frontend test:e2e:open`.

## 4. Integration Testing
Runs against the **deployed** environment.
- **Script**: `scripts/integration-test.js`.
- **Usage**:
  ```bash
  export NEXT_PUBLIC_API_URL=https://your-api-url.com
  pnpm test:integration
  ```
- **CI**: Runs automatically after deployment in the pipeline.

## Root Test Runner
To run all unit/infra tests with coverage across the monorepo:
```bash
pnpm test:coverage
```
