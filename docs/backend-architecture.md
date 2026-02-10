# Backend Architecture

This project implements a **Serverless Event-Driven Architecture** using AWS Lambda, DynamoDB, and EventBridge.

## 1. Compute: AWS Lambda
We use **Node.js 22** with **TypeScript**.

### Handler Pattern
All handlers are located in `backend/src/handlers/`. They follow a functional pattern wrapped in standard middleware.

```typescript
import { commonMiddleware } from "../lib/middleware";

const baseHandler = async (event, context) => {
  // Business logic here
  return { statusCode: 200, body: JSON.stringify({ message: "Success" }) };
};

export const handler = commonMiddleware(baseHandler);
```

### Middleware (`backend/src/lib/middleware.ts`)
We use [Middy](https://middy.js.org/) to standardize cross-cutting concerns:
- **`http-json-body-parser`**: Automatically parses JSON bodies.
- **`http-event-normalizer`**: Simplifies API Gateway events.
- **`http-header-normalizer`**: normalizes headers to lowercase.
- **`http-cors`**: Standard CORS headers.
- **Observability**: Automatically capturing cold starts and flushing metrics.
- **Error Handling**: Catches `AppError` and standardizes generic errors to 500s.

## 2. Database: DynamoDB + ElectroDB
We use a **Single Table Design** modeled with [ElectroDB](https://electrodb.dev/).

### Why ElectroDB?
ElectroDB acts as an ODM (Object Data Mapper) for DynamoDB. It handles:
- **KEYS**: Auto-generating complex Partition Keys (`pk`) and Sort Keys (`sk`).
- **Typing**: Full TypeScript support for items.
- **Validation**: Schema validation before writing.

### Entity Definitions (`backend/src/entities/`)
Entities are defined in `backend/src/entities/item.ts`.

```typescript
const ItemEntity = new Entity({
  model: { entity: "item", service: "hmaas", version: "1" },
  attributes: {
    itemId: { type: "string", required: true },
    name: { type: "string", required: true },
    description: { type: "string" },
    createdAt: { type: "string", default: () => new Date().toISOString() },
  },
  indexes: {
    primary: {
      pk: { field: "pk", composite: ["itemId"] },
      sk: { field: "sk", composite: [] },
    },
  },
});
```

### Seeding Data
We use a **CloudFormation Custom Resource** (`backend/src/handlers/seedData.ts`) to seed reference data when the stack is deployed.

## 3. Event-Driven Messaging: EventBridge
Decouples services using an Event Bus.

### Architecture
1.  **Producer**: `createItem` Lambda publishes an `ItemCreated` event to the `HmaasEventBus`.
2.  **Bus**: Routes events based on rules.
3.  **Consumer**: `processEvent` Lambda is triggered by the rule.

### Code Example
```typescript
import { EventBridgeClient, PutEventsCommand } from "@aws-sdk/client-eventbridge";

await ebClient.send(new PutEventsCommand({
  Entries: [{
    Source: "hmaas.api",
    DetailType: "ItemCreated",
    Detail: JSON.stringify({ itemId: "123" }),
    EventBusName: process.env.EVENT_BUS_NAME,
  }]
}));
```

## 4. Resilience: Dead Letter Queues (DLQ)
Reliability is built-in to avoid data loss.

- **Lambda DLQ**: All async Lambdas (like `processEvent`) are configured with an SQS Queue for failed invocations.
- **Retention**: Messages are kept for 14 days.
- **Alarms**: High severity alarm if messages appear in the DLQ.

## 5. Validation: Zod
We use [Zod](https://zod.dev/) for runtime schema validation.

```typescript
import { z } from "zod";
const CreateItemSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
});

// usage
const body = CreateItemSchema.parse(event.body);
```
