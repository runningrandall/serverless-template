# Test Service Observability

We use **AWS Lambda Powertools for TypeScript** and **Amazon CloudWatch** for full-stack observability.

## 1. Metrics (`@aws-lambda-powertools/metrics`)
Custom metrics are published to CloudWatch under the namespace `Test`.
- **Standard**: ColdStart, Lambda Error Rate.
- **Custom**: `ItemsCreated`, `ValidationErrors`, `EventPublishErrors`.

**Usage:**
```typescript
import { metrics } from "../lib/observability";
import { MetricUnit } from "@aws-lambda-powertools/metrics";

metrics.addMetric('ItemCreated', MetricUnit.Count, 1);
```

## 2. Logging (`@aws-lambda-powertools/logger`)
Structured JSON logging with context injection.
- **Standard**: Log level, service name, X-Ray trace ID.
- **Context**: Request ID, Cold Start status.

**Usage:**
```typescript
import { logger } from "../lib/observability";
logger.info("Processing item", { itemId: "123" });
```

## 3. Tracing (`@aws-lambda-powertools/tracer`)
X-Ray tracing is enabled for all Lambdas.
- Automatically traces AWS SDK calls (DynamoDB, EventBridge).

**Usage:**
```typescript
import { tracer } from "../lib/observability";
// SDK clients are mostly auto-instrumented if using the captureAWSv3Client wrapper
const ddb = tracer.captureAWSv3Client(new DynamoDBClient({}));
```

## 4. CloudWatch Dashboard
A dashboard is automatically created for each stage: `<stage>-ServiceDashboard`.
It visualizes:
- **API**: Traffic, Latency, Errors.
- **Functions**: Duration, Invocations, Errors.
- **Database**: Throttles, Capacity.
- **System**: DLQ depth, WAF blocks.

## 5. Alarms & Notifications
Alarms are provisioned in `infra-stack.ts` and send notifications to an SNS Topic.
- **High Severity**: API 5xx, Lambda Errors, DLQ not empty.
- **Subscription**: Manual subscription required for email (output in deploy logs).
