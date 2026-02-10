# HMaaS API

> Home Maintenance as a Service — RESTful API for managing items. All endpoints require a valid Cognito JWT bearer token.

**Version:** 1.0.0 | **OpenAPI Spec:** [swagger.json](swagger.json)

## Servers

| Name | URL |
|------|-----|
| Production | `https://{apiId}.execute-api.{region}.amazonaws.com/prod` |
| Local Development | `http://localhost:3001` |

## Authentication

All endpoints require **bearer authentication** (`JWT`).

```
Authorization: Bearer <token>
```

## Endpoints

| Method | Path | Summary |
|--------|------|---------|
| `GET` | `/categories` | List categories (paginated) |
| `POST` | `/categories` | Create a category |
| `GET` | `/categories/{categoryId}` | Get a category by ID |
| `DELETE` | `/categories/{categoryId}` | Delete a category |
| `GET` | `/items` | List items (paginated) |
| `POST` | `/items` | Create an item |
| `GET` | `/items/{itemId}` | Get an item by ID |
| `DELETE` | `/items/{itemId}` | Delete an item |

---

### `GET /categories`

Returns a paginated list of service categories.

**Parameters:**

| Name | In | Type | Required | Description |
|------|----|------|----------|-------------|
| `limit` | query | `string` | ❌ | Max items per page (default: 20) |
| `cursor` | query | `string` | ❌ | Cursor from previous response |

**Responses:**

<details>
<summary><code>200</code> — Paginated list of categories</summary>

```json
{
  "items": [
    {
      "categoryId": "cat-abc-123",
      "name": "Plumbing",
      "description": "Plumbing repairs and installations",
      "createdAt": "2024-01-01T00:00:00Z"
    }
  ],
  "cursor": "eyJway..."
}
```

</details>

<details>
<summary><code>401</code> — Unauthorized</summary>

```json
{
  "error": {
    "code": "NOT_FOUND",
    "message": "Item not found",
    "details": [
      {
        "path": "name",
        "message": "Required"
      }
    ],
    "requestId": "abc-123-def"
  }
}
```

</details>

<details>
<summary><code>500</code> — Internal server error</summary>

```json
{
  "error": {
    "code": "NOT_FOUND",
    "message": "Item not found",
    "details": [
      {
        "path": "name",
        "message": "Required"
      }
    ],
    "requestId": "abc-123-def"
  }
}
```

</details>

---

### `POST /categories`

Creates a new service category.

**Request Body:**

```json
{
  "name": "Plumbing",
  "description": "Plumbing repairs and installations"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | `string` | ✅ |  |
| `description` | `string` | ❌ |  |

**Responses:**

<details>
<summary><code>201</code> — Category created</summary>

```json
{
  "categoryId": "cat-abc-123",
  "name": "Plumbing",
  "description": "Plumbing repairs and installations",
  "createdAt": "2024-01-01T00:00:00Z"
}
```

</details>

<details>
<summary><code>400</code> — Validation error</summary>

```json
{
  "error": {
    "code": "NOT_FOUND",
    "message": "Item not found",
    "details": [
      {
        "path": "name",
        "message": "Required"
      }
    ],
    "requestId": "abc-123-def"
  }
}
```

</details>

<details>
<summary><code>401</code> — Unauthorized</summary>

```json
{
  "error": {
    "code": "NOT_FOUND",
    "message": "Item not found",
    "details": [
      {
        "path": "name",
        "message": "Required"
      }
    ],
    "requestId": "abc-123-def"
  }
}
```

</details>

<details>
<summary><code>500</code> — Internal server error</summary>

```json
{
  "error": {
    "code": "NOT_FOUND",
    "message": "Item not found",
    "details": [
      {
        "path": "name",
        "message": "Required"
      }
    ],
    "requestId": "abc-123-def"
  }
}
```

</details>

---

### `GET /categories/{categoryId}`

Returns a single service category.

**Parameters:**

| Name | In | Type | Required | Description |
|------|----|------|----------|-------------|
| `categoryId` | path | `string` | ✅ | Unique category identifier |

**Responses:**

<details>
<summary><code>200</code> — Category found</summary>

```json
{
  "categoryId": "cat-abc-123",
  "name": "Plumbing",
  "description": "Plumbing repairs and installations",
  "createdAt": "2024-01-01T00:00:00Z"
}
```

</details>

<details>
<summary><code>400</code> — Missing categoryId</summary>

```json
{
  "error": {
    "code": "NOT_FOUND",
    "message": "Item not found",
    "details": [
      {
        "path": "name",
        "message": "Required"
      }
    ],
    "requestId": "abc-123-def"
  }
}
```

</details>

<details>
<summary><code>401</code> — Unauthorized</summary>

```json
{
  "error": {
    "code": "NOT_FOUND",
    "message": "Item not found",
    "details": [
      {
        "path": "name",
        "message": "Required"
      }
    ],
    "requestId": "abc-123-def"
  }
}
```

</details>

<details>
<summary><code>404</code> — Category not found</summary>

```json
{
  "error": {
    "code": "NOT_FOUND",
    "message": "Item not found",
    "details": [
      {
        "path": "name",
        "message": "Required"
      }
    ],
    "requestId": "abc-123-def"
  }
}
```

</details>

<details>
<summary><code>500</code> — Internal server error</summary>

```json
{
  "error": {
    "code": "NOT_FOUND",
    "message": "Item not found",
    "details": [
      {
        "path": "name",
        "message": "Required"
      }
    ],
    "requestId": "abc-123-def"
  }
}
```

</details>

---

### `DELETE /categories/{categoryId}`

Deletes a service category by its unique identifier.

**Parameters:**

| Name | In | Type | Required | Description |
|------|----|------|----------|-------------|
| `categoryId` | path | `string` | ✅ | Unique category identifier |

**Responses:**

<details>
<summary><code>200</code> — Category deleted</summary>

```json
{
  "message": "Category deleted"
}
```

</details>

<details>
<summary><code>400</code> — Missing categoryId</summary>

```json
{
  "error": {
    "code": "NOT_FOUND",
    "message": "Item not found",
    "details": [
      {
        "path": "name",
        "message": "Required"
      }
    ],
    "requestId": "abc-123-def"
  }
}
```

</details>

<details>
<summary><code>401</code> — Unauthorized</summary>

```json
{
  "error": {
    "code": "NOT_FOUND",
    "message": "Item not found",
    "details": [
      {
        "path": "name",
        "message": "Required"
      }
    ],
    "requestId": "abc-123-def"
  }
}
```

</details>

<details>
<summary><code>500</code> — Internal server error</summary>

```json
{
  "error": {
    "code": "NOT_FOUND",
    "message": "Item not found",
    "details": [
      {
        "path": "name",
        "message": "Required"
      }
    ],
    "requestId": "abc-123-def"
  }
}
```

</details>

---

### `GET /items`

Returns a paginated list of items. Use `limit` and `cursor` query parameters to navigate pages.

**Parameters:**

| Name | In | Type | Required | Description |
|------|----|------|----------|-------------|
| `limit` | query | `string` | ❌ | Max items per page (default: 20) |
| `cursor` | query | `string` | ❌ | Cursor from previous response for next page |

**Responses:**

<details>
<summary><code>200</code> — Paginated list of items</summary>

```json
{
  "items": [
    {
      "itemId": "123-abc",
      "name": "Compass",
      "description": "A magnetic compass",
      "createdAt": "2024-01-01T00:00:00Z"
    }
  ],
  "cursor": "eyJway..."
}
```

</details>

<details>
<summary><code>401</code> — Unauthorized</summary>

```json
{
  "error": {
    "code": "NOT_FOUND",
    "message": "Item not found",
    "details": [
      {
        "path": "name",
        "message": "Required"
      }
    ],
    "requestId": "abc-123-def"
  }
}
```

</details>

<details>
<summary><code>500</code> — Internal server error</summary>

```json
{
  "error": {
    "code": "NOT_FOUND",
    "message": "Item not found",
    "details": [
      {
        "path": "name",
        "message": "Required"
      }
    ],
    "requestId": "abc-123-def"
  }
}
```

</details>

---

### `POST /items`

Creates a new item. Returns the created item with generated `itemId` and `createdAt`.

**Request Body:**

```json
{
  "name": "Compass",
  "description": "A magnetic compass"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | `string` | ✅ |  |
| `description` | `string` | ❌ |  |

**Responses:**

<details>
<summary><code>201</code> — Item created successfully</summary>

```json
{
  "itemId": "123-abc",
  "name": "Compass",
  "description": "A magnetic compass",
  "createdAt": "2024-01-01T00:00:00Z"
}
```

</details>

<details>
<summary><code>400</code> — Validation error</summary>

```json
{
  "error": {
    "code": "NOT_FOUND",
    "message": "Item not found",
    "details": [
      {
        "path": "name",
        "message": "Required"
      }
    ],
    "requestId": "abc-123-def"
  }
}
```

</details>

<details>
<summary><code>401</code> — Unauthorized</summary>

```json
{
  "error": {
    "code": "NOT_FOUND",
    "message": "Item not found",
    "details": [
      {
        "path": "name",
        "message": "Required"
      }
    ],
    "requestId": "abc-123-def"
  }
}
```

</details>

<details>
<summary><code>500</code> — Internal server error</summary>

```json
{
  "error": {
    "code": "NOT_FOUND",
    "message": "Item not found",
    "details": [
      {
        "path": "name",
        "message": "Required"
      }
    ],
    "requestId": "abc-123-def"
  }
}
```

</details>

---

### `GET /items/{itemId}`

Returns a single item by its unique identifier.

**Parameters:**

| Name | In | Type | Required | Description |
|------|----|------|----------|-------------|
| `itemId` | path | `string` | ✅ | Unique item identifier |

**Responses:**

<details>
<summary><code>200</code> — Item found</summary>

```json
{
  "itemId": "123-abc",
  "name": "Compass",
  "description": "A magnetic compass",
  "createdAt": "2024-01-01T00:00:00Z"
}
```

</details>

<details>
<summary><code>400</code> — Missing itemId</summary>

```json
{
  "error": {
    "code": "NOT_FOUND",
    "message": "Item not found",
    "details": [
      {
        "path": "name",
        "message": "Required"
      }
    ],
    "requestId": "abc-123-def"
  }
}
```

</details>

<details>
<summary><code>401</code> — Unauthorized</summary>

```json
{
  "error": {
    "code": "NOT_FOUND",
    "message": "Item not found",
    "details": [
      {
        "path": "name",
        "message": "Required"
      }
    ],
    "requestId": "abc-123-def"
  }
}
```

</details>

<details>
<summary><code>404</code> — Item not found</summary>

```json
{
  "error": {
    "code": "NOT_FOUND",
    "message": "Item not found",
    "details": [
      {
        "path": "name",
        "message": "Required"
      }
    ],
    "requestId": "abc-123-def"
  }
}
```

</details>

<details>
<summary><code>500</code> — Internal server error</summary>

```json
{
  "error": {
    "code": "NOT_FOUND",
    "message": "Item not found",
    "details": [
      {
        "path": "name",
        "message": "Required"
      }
    ],
    "requestId": "abc-123-def"
  }
}
```

</details>

---

### `DELETE /items/{itemId}`

Deletes an item by its unique identifier.

**Parameters:**

| Name | In | Type | Required | Description |
|------|----|------|----------|-------------|
| `itemId` | path | `string` | ✅ | Unique item identifier |

**Responses:**

<details>
<summary><code>200</code> — Item deleted successfully</summary>

```json
{
  "message": "Item deleted"
}
```

</details>

<details>
<summary><code>400</code> — Missing itemId</summary>

```json
{
  "error": {
    "code": "NOT_FOUND",
    "message": "Item not found",
    "details": [
      {
        "path": "name",
        "message": "Required"
      }
    ],
    "requestId": "abc-123-def"
  }
}
```

</details>

<details>
<summary><code>401</code> — Unauthorized</summary>

```json
{
  "error": {
    "code": "NOT_FOUND",
    "message": "Item not found",
    "details": [
      {
        "path": "name",
        "message": "Required"
      }
    ],
    "requestId": "abc-123-def"
  }
}
```

</details>

<details>
<summary><code>500</code> — Internal server error</summary>

```json
{
  "error": {
    "code": "NOT_FOUND",
    "message": "Item not found",
    "details": [
      {
        "path": "name",
        "message": "Required"
      }
    ],
    "requestId": "abc-123-def"
  }
}
```

</details>

---

## Schemas

### ErrorResponse

```json
{
  "type": "object",
  "properties": {
    "error": {
      "type": "object",
      "properties": {
        "code": {
          "type": "string",
          "example": "NOT_FOUND"
        },
        "message": {
          "type": "string",
          "example": "Item not found"
        },
        "details": {
          "nullable": true,
          "example": [
            {
              "path": "name",
              "message": "Required"
            }
          ]
        },
        "requestId": {
          "type": "string",
          "example": "abc-123-def"
        }
      },
      "required": [
        "code",
        "message"
      ]
    }
  },
  "required": [
    "error"
  ]
}
```

### CreateItem

```json
{
  "type": "object",
  "properties": {
    "name": {
      "type": "string",
      "minLength": 1,
      "example": "Compass"
    },
    "description": {
      "type": "string",
      "example": "A magnetic compass"
    }
  },
  "required": [
    "name"
  ]
}
```

### Item

```json
{
  "allOf": [
    {
      "$ref": "#/components/schemas/CreateItem"
    },
    {
      "type": "object",
      "properties": {
        "itemId": {
          "type": "string",
          "example": "123-abc"
        },
        "createdAt": {
          "type": "number",
          "example": 1678900000000
        },
        "updatedAt": {
          "type": "number",
          "example": 1678900000000
        }
      },
      "required": [
        "itemId"
      ]
    }
  ]
}
```

### ItemResponse

```json
{
  "type": "object",
  "properties": {
    "itemId": {
      "type": "string",
      "example": "123-abc"
    },
    "name": {
      "type": "string",
      "example": "Compass"
    },
    "description": {
      "type": "string",
      "nullable": true,
      "example": "A magnetic compass"
    },
    "createdAt": {
      "type": "string",
      "example": "2024-01-01T00:00:00Z"
    }
  },
  "required": [
    "itemId",
    "name",
    "createdAt"
  ]
}
```

### CreateItemRequest

```json
{
  "type": "object",
  "properties": {
    "name": {
      "type": "string",
      "minLength": 1,
      "example": "Compass"
    },
    "description": {
      "type": "string",
      "example": "A magnetic compass"
    }
  },
  "required": [
    "name"
  ]
}
```

### CreateCategoryRequest

```json
{
  "type": "object",
  "properties": {
    "name": {
      "type": "string",
      "minLength": 1,
      "example": "Plumbing"
    },
    "description": {
      "type": "string",
      "example": "Plumbing repairs and installations"
    }
  },
  "required": [
    "name"
  ]
}
```

---

*Generated at 2026-02-10T21:06:41.438Z from OpenAPI spec.*