# Contributing

Thank you for your interest in contributing to this template! Here's how to get started.

## Getting Started

1. **Fork** this repository
2. **Clone** your fork locally
3. **Install dependencies**: `pnpm install`
4. **Create a branch**: `git checkout -b feature/my-change`

## Development Workflow

1. Make your changes following the existing code patterns
2. Use `pnpm generate` to scaffold new endpoints or components
3. Write tests for any new functionality
4. Run all tests: `pnpm test`
5. Commit using conventional commits: `pnpm commit`
6. Push and open a Pull Request

## Code Style

- **TypeScript** for all backend and infra code
- **ESLint** enforced via pre-commit hook on frontend code
- **Conventional Commits** for commit messages (`feat:`, `fix:`, `docs:`, etc.)

## Project Structure

| Directory | Purpose |
|---|---|
| `backend/src/handlers/` | Lambda handlers — one file per endpoint |
| `backend/src/lib/` | Shared utilities (middleware, error, observability, schemas) |
| `backend/src/entities/` | ElectroDB entity definitions |
| `frontend/app/` | Next.js pages |
| `frontend/components/` | React components |
| `frontend/stories/` | Storybook stories |
| `infra/lib/` | CDK stack definitions |
| `templates/` | Plop code generator templates |
| `scripts/` | Local development helper scripts |

## Adding a New API Endpoint

1. Run `pnpm generate` and select **endpoint**
2. Implement the handler logic in `backend/src/handlers/<name>.ts`
3. Add the Lambda function and API Gateway route in `infra/lib/infra-stack.ts`
4. Add tests in `backend/test/handlers/<name>.test.ts`

## Adding a New React Component

1. Run `pnpm generate` and select **component**
2. Implement in `frontend/components/<Name>/<Name>.tsx`
3. A Storybook story is auto-created in `frontend/stories/`

## Testing

- **Backend**: `pnpm --filter backend test` (Vitest)
- **Infrastructure**: `pnpm --filter infra test` (Jest)
- **E2E**: `pnpm --filter frontend test:e2e` (Cypress)
- **All**: `pnpm test`

## Pull Request Guidelines

- One feature/fix per PR
- Include tests for new functionality
- Update documentation if applicable
- All CI checks must pass
