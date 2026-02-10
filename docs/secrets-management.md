# Secrets Management Strategy

For a serverless application deployed via GitHub Actions, we recommend a **hybrid approach** using both GitHub Secrets and AWS Systems Manager (SSM) Parameter Store / Secrets Manager.

## 1. GitHub Secrets (CI/CD Pipeline)
Use GitHub Secrets for **deployment credentials** and **build-time configuration** that must be injected during the build process.

**What goes here:**
- `AWS_ACCESS_KEY_ID` (for deploying via CDK)
- `AWS_SECRET_ACCESS_KEY`
- `INFRACOST_API_KEY` (for cost estimation)
- `NEXT_PUBLIC_API_URL` (if binding frontend to a specific API URL at build time, though our dynamic stack output approach handles this better)

**How to use:**
These are accessed in `.github/workflows/deploy.yml` via `${{ secrets.MY_SECRET }}`.

## 2. AWS Systems Manager (SSM) Parameter Store (Runtime Configuration)
Use SSM Parameter Store for **application configuration** and **non-sensitive secrets** (e.g., feature flags, public keys, service URLs).

**Why:** 
- Free (Standard tier)
- Native integration with CDK and Lambda
- Supports versioning

**How to use in CDK:**
```typescript
const param = new ssm.StringParameter(this, 'MyParam', {
  parameterName: '/my-app/prod/api-url',
  stringValue: 'https://api.example.com',
});
// Grant read access to Lambda
param.grantRead(myLambda);
```

## 3. AWS Secrets Manager (Runtime Secrets) 🔒
Use AWS Secrets Manager for **sensitive runtime secrets** (e.g., Database passwords, Stripe API keys, OAuth tokens).

**Why:**
- Automatic rotation (e.g., for RDS)
- Encryption at rest (KMS)
- Fine-grained access control
- **CRITICAL:** Avoids baking secrets into Lambda Environment Variables (which are visible in the AWS Console).

**Recommended Pattern (Runtime Fetching):**
Instead of setting secrets as Lambda Environment Variables (which exposes them), fetch them at runtime using the **AWS Parameters and Secrets Lambda Extension** or Powertools.

**Example with Powertools:**
```typescript
import { getSecret } from '@aws-lambda-powertools/parameters/secrets';

const handler = async () => {
    // Fetches and caches the secret
    const stripeKey = await getSecret('stripe-api-key', { maxAge: 60 });
    // ...
};
```

## Summary Table

| Secret Type | Tool | Why? |
|-------------|------|------|
| **AWS Credentials** | GitHub Secrets | Required for CDK deployment |
| **CI/CD Keys (Infracost)** | GitHub Secrets | Required for pipeline jobs |
| **Database Host/Port** | SSM Parameter Store | Configuration, not sensitive |
| **Third-Party API Keys** | AWS Secrets Manager | Highly sensitive, rotation support |
| **Feature Flags** | SSM Parameter Store | operational toggles |

## Next Steps for You
1. **Infrastructure**: Add `SecretsStack` or define secrets in `InfraStack` using CDK `access_key` placeholders.
   - *Note: You cannot populate the secret value via CDK code (that leaks it). You create the Secret resource in CDK with a dummy value, then manually update it in the AWS Console one time.*
2. **Backend**: Use `@aws-lambda-powertools/parameters` to fetch secrets in your handlers.
