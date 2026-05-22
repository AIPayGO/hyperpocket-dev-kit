# Add API Endpoint

Scaffold a new Hono API endpoint in hyperpocket-api following team conventions.

## Instructions

Ask the user for the following before generating any code:

1. **Route prefix** — which top-level router does this belong to? (e.g. `wallet`, `admin`, `webhook`, `payment-session`)
2. **Resource name** — singular noun for the resource (e.g. `transaction`, `fee`, `product`)
3. **Operations** — which HTTP methods are needed? (GET list, GET by ID, POST, PATCH, DELETE)
4. **Auth level** — who can call this? (`product-api-key` via `Authorization: Bearer`, `admin` via admin key, `public`)
5. **Money fields** — does any response or body include monetary amounts? (affects Drizzle column type and Zod schema)
6. **Pagination** — does the GET list endpoint need cursor/offset pagination?

## Patterns to Follow

### File Layout

```
src/
  routes/
    <router>/
      <resource>.ts       ← route handlers
  db/
    schema/
      <resource>.ts       ← Drizzle schema (if new table)
  types/
    <resource>.ts         ← shared TypeScript types (optional)
```

### Route Handler Pattern

```typescript
import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod/v4";
import { db } from "../../db/index.js";
import { logger } from "../../lib/logger.js";

const app = new Hono();

app.get("/", zValidator("query", querySchema), async (c) => {
  const query = c.req.valid("query");

  try {
    // DB query here
    logger.info({ query }, "fetching resources");
    return c.json({ data: [], total: 0 });
  } catch (err) {
    logger.error({ err }, "failed to fetch resources");
    return c.json({ error: "Internal server error" }, 500);
  }
});

export default app;
```

### Auth Middleware

For product API key auth, add the middleware from `src/middleware/auth.ts` to the router mount point — do NOT add it inside each handler.

### Money Fields

- Drizzle column: `numeric("amount", { precision: 19, scale: 4 }).notNull()`
- Zod schema: `z.string().regex(/^\d+(\.\d{1,4})?$/)` (amounts come in as strings to avoid float precision)
- Never use `number` for monetary values

### Pagination Shape (GET list)

```typescript
return c.json({
  data: rows,
  total: count,
  page: query.page,
  limit: query.limit,
});
```

### Drizzle Transactions

Wrap multi-table writes in `db.transaction()`:

```typescript
await db.transaction(async (tx) => {
  await tx.insert(tableA).values(...);
  await tx.insert(tableB).values(...);
});
```

### Error Response Shape

```typescript
return c.json({ error: "Human-readable message" }, 400);
```

### Logging

Use `logger.info(contextObject, "message")` — object first, string second. Never string interpolation.

```typescript
logger.info({ walletId, amount }, "processing deposit");
logger.error({ err, walletId }, "deposit failed");
```

## New Enum Values

If the new endpoint requires a new enum value in the DB schema, generate a separate migration file:

```sql
ALTER TYPE <enum_name> ADD VALUE '<new_value>';
```

Remind the user to run `pnpm db:migrate` (not `pnpm db:push`) after adding enum values.

## Output

Generate all files needed: route handler, Drizzle schema additions (if any), and the router mount line to add to `src/index.ts` or the parent router. Show the full file contents, not diffs.
