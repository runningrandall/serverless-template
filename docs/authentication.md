# Authentication & Authorization

This project uses a modern serverless authentication stack combining **Amazon Cognito** for identity management and **Amazon Verified Permissions (AVP)** for fine-grained authorization.

## Architecture

1.  **Identity (Who are you?)**: Amazon Cognito User Pool handles sign-up, sign-in, and JWT issuance.
2.  **Authorization (What can you do?)**: Amazon Verified Permissions evaluates Cedar policies to allow/deny actions.
3.  **Enforcement**: A Lambda Authorizer intercepts every API request, validates the JWT, and queries AVP for a decision.

## Cognito (Identity)

- **User Pool**: Manages users and groups (e.g., `admin`, `user`).
- **App Client**: Used by the frontend to authenticate.
- **Triggers**: Pre-sign-up or post-confirmation triggers can be added in `infra/lib/auth-stack.ts`.

## Verified Permissions (Authorization)

We use the [Cedar](https://www.cedarpolicy.com/) policy language.

### Policy Store
Defined in `infra/lib/auth-stack.ts`.

### Schema
- **Entities**: `User`, `Action`, `Resource`.
- **Actions**: `Action::"ReadDashboard"`, `Action::"ManageUsers"`, etc.

### Example Policy
```cedar
permit(
    principal,
    action in [Action::"ReadDashboard"],
    resource
);
```

## Lambda Authorizer (`backend/src/auth/authorizer.ts`)

The authorizer performs the following steps:
1.  **Validates JWT**: checks signature, expiration, and issuer.
2.  **Maps Request to Action**:
    - `GET /items` -> `ReadDashboard`
    - `POST /items` -> `ManageUsers`
    - (Mapping logic is in `authorizer.ts`)
3.  **Evaluates Policy**: Calls `verifiedpermissions:IsAuthorized` with the Principal (User ID), Action, and Resource.
4.  **Returns Policy**: Generates an IAM Policy Allow/Deny for API Gateway.

## Adding New Roles/Permissions

1.  Update the Schema in `infra/lib/auth-stack.ts` if adding new Actions.
2.  Update the Policy definition in `infra/lib/auth-stack.ts`.
3.  Update the mapping logic in `backend/src/auth/authorizer.ts` to map API routes to new Actions.
