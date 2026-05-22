# Add Payment Processor

Scaffold a new payment processor integration in hyperpocket-api following the ProcessorFactory pattern.

## Instructions

Ask the user for the following before generating any code:

1. **Processor name** — identifier used in code (e.g. `stripe`, `braintree`, `omise`)
2. **Product types supported** — which product codes does this processor handle? (e.g. `RIDE`, `RENTAL`, `DELIVERY`)
3. **Payment methods** — which payment methods does it support? (card, bank transfer, QR, wallet)
4. **Webhook support** — does this processor send webhooks? If yes, what event types?
5. **Vault/token support** — does this processor support saving payment methods (vault tokens)?
6. **SDK available** — is there an npm package, or will you use raw HTTP/axios?

## Patterns to Follow

### File Layout

```
src/
  processors/
    <name>/
      index.ts          ← exports the processor class
      client.ts         ← SDK/HTTP client initialization
      types.ts          ← processor-specific types
      webhook.ts        ← webhook signature verification + event handling (if applicable)
  db/
    schema/
      processor-configs.ts  ← already exists; add product-specific credential shape here
```

### Processor Class Pattern

```typescript
import type { PaymentProcessor } from "../types.js";

export class <Name>Processor implements PaymentProcessor {
  private client: <SdkClient>;

  constructor(private config: <Name>ProcessorConfig) {
    this.client = initClient(config);
  }

  async chargeCard(params: ChargeParams): Promise<ChargeResult> { ... }
  async authorizeCard(params: AuthorizeParams): Promise<AuthResult> { ... }
  async captureAuth(authId: string, amount: string): Promise<CaptureResult> { ... }
  async voidAuth(authId: string): Promise<void> { ... }
  async refund(transactionId: string, amount: string): Promise<RefundResult> { ... }
}
```

### ProcessorFactory Registration

In `src/processors/factory.ts`, register the new processor by product code:

```typescript
case "PRODUCT_CODE":
  return new <Name>Processor(credentials as <Name>ProcessorConfig);
```

### Credentials Storage

Credentials are stored as JSONB in the `processor_configs` table, keyed by product. **Never** return credentials in API responses. The config shape:

```typescript
interface <Name>ProcessorConfig {
  publicKey: string;
  privateKey: string;
  merchantId?: string;
  environment: "sandbox" | "production";
  // ... processor-specific fields
}
```

Retrieve the processor in a route handler:

```typescript
const processor = await ProcessorFactory.forProduct(productCode, db);
```

### Vault Token Routing

If the processor supports vaulted payment methods, the server (not client) determines whether a given token is a vault token or a one-time nonce using an `isVaultToken` flag. Never trust the client to distinguish these.

### Webhook Handler Pattern

```typescript
// src/processors/<name>/webhook.ts
export async function verify<Name>Signature(
  payload: string,
  signature: string,
  secret: string,
): Promise<boolean> {
  const expected = createHmac("sha256", secret).update(payload).digest("hex");
  return timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
}

export async function handle<Name>Webhook(
  event: <Name>WebhookEvent,
  db: Database,
): Promise<void> {
  switch (event.type) {
    case "payment.settled":
      // update transaction status, increment availableBalance
      break;
    // ...
  }
}
```

Register the webhook route in `src/routes/webhook/<name>.ts` and mount it in the main webhook router.

### Custom Fields / Metadata

If the processor requires custom fields (like Braintree), document which fields must be pre-registered in the processor's control panel and add a note in the `hyperpocket-api/CLAUDE.md` file.

### Environment Variables

Add any new env vars (API keys, webhook secrets) to:
1. `src/config.ts` or equivalent config file
2. `.env.example`
3. AWS SSM Parameter Store path: `/hyperpocket/<env>/<PROCESSOR_NAME>_<KEY_NAME>`
4. The `hyperpocket-infra/accounts/hyperpocket/staging/main.tf` SSM parameter list

## Testing

Generate a test file at `tests/processors/<name>.test.ts` covering:
- Successful charge
- Auth + capture flow (if applicable)
- Webhook signature verification
- Credential lookup from DB

Use the existing test setup patterns from `tests/payments.test.ts` for DB cleanup order.

## Output

Generate all files: processor class, factory registration diff, webhook handler (if applicable), env var additions, and test file stubs.
