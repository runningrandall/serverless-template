# Project Structure

This monorepo uses `pnpm` workspaces for efficient dependency management.

```
.
├── backend/                 # AWS Lambda Application
│   ├── src/
│   │   ├── auth/            # Authorizer Logic
│   │   ├── entities/        # ElectroDB Schemas (Single Table Design)
│   │   ├── handlers/        # Lambda Entry Points
│   │   └── lib/             # Validations, Middleware, Utils
│   └── test/                # Unit Tests
│
├── frontend/                # Next.js Application
│   ├── app/                 # App Router Pages
│   ├── components/          # React Components
│   └── lib/                 # Frontend Utilities & API Client
│
├── infra/                   # AWS CDK Infrastructure
│   ├── bin/                 # Entry Point & App Config
│   └── lib/                 # Stack Definitions (Auth, Infra, Frontend)
│
├── .github/workflows/       # CI/CD Definitions
└── scripts/                 # Utility Scripts (Local DB, Integration Tests)
```

## Key Technologies

### Backend
- **Node.js 22**
- **TypeScript**
- **Middy**: Middleware engine (cors, parsing, error handling).
- **ElectroDB**: DynamoDB modeling library.
- **Zod**: Runtime validation.

### Frontend
- **Next.js 16** (Static Export support).
- **Tailwind CSS**.
- **shadcn/ui**: Component library.
- **AWS Amplify**: Client SDK for Auth/API.

### Infrastructure
- **AWS CDK**: Infrastructure as Code.
- **cdk-nag**: Security compliance checks.
