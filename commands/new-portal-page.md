# New Portal Page

Scaffold a new SvelteKit page in hyperpocket-portal following team conventions.

## Instructions

Ask the user for the following before generating any code:

1. **Route path** — where does this page live? (e.g. `/transactions`, `/admin/fees`, `/settings/webhooks`)
2. **Auth requirement** — authenticated `(app)` route or public `(public)` route?
3. **Page purpose** — list/table, detail view, form/settings, or dashboard?
4. **API endpoints used** — which hyperpocket-api endpoints does this page call? (helps infer data shape)
5. **Actions needed** — does the page submit forms or trigger mutations (POST/PATCH/DELETE)?

## Patterns to Follow

### File Layout

```
src/routes/
  (app)/
    <path>/
      +page.svelte        ← UI component
      +page.server.ts     ← server-side load + form actions
  (public)/
    <path>/
      +page.svelte
      +page.server.ts
```

### Server-Side Load Pattern

**All** API calls must happen server-side. Never call the wallet API from the browser.

```typescript
// +page.server.ts
import type { PageServerLoad } from "./$types";
import { env } from "$env/dynamic/private";
import { error } from "@sveltejs/kit";

export const load: PageServerLoad = async ({ fetch, params }) => {
  const res = await fetch(`${env.WALLET_API_URL}/path`, {
    headers: { Authorization: `Bearer ${env.WALLET_API_KEY}` },
  });

  if (!res.ok) {
    throw error(res.status, "Failed to load data");
  }

  return { data: await res.json() };
};
```

### Form Actions Pattern

```typescript
// +page.server.ts
import { fail, redirect } from "@sveltejs/kit";
import type { Actions } from "./$types";

export const actions: Actions = {
  default: async ({ request, fetch }) => {
    const form = await request.formData();
    const value = form.get("field");

    const res = await fetch(`${env.WALLET_API_URL}/path`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.WALLET_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ value }),
    });

    if (!res.ok) {
      return fail(res.status, { error: "Action failed" });
    }

    redirect(303, "/success-path");
  },
};
```

### UI Component Pattern

Use Tailwind CSS v4 + DaisyUI v5 components. Keep components in `.svelte` files — no separate component library unless the element is truly reused across 3+ pages.

```svelte
<script lang="ts">
  import type { PageData } from "./$types";
  let { data }: { data: PageData } = $props();
</script>

<div class="p-6">
  <h1 class="text-2xl font-bold mb-4">Page Title</h1>

  <!-- Table example -->
  <div class="overflow-x-auto">
    <table class="table table-zebra">
      <thead>
        <tr>
          <th>Column</th>
        </tr>
      </thead>
      <tbody>
        {#each data.items as item}
          <tr>
            <td>{item.field}</td>
          </tr>
        {/each}
      </tbody>
    </table>
  </div>
</div>
```

### Money Display

Always display monetary amounts formatted with currency symbol. Use a shared formatter:

```typescript
// src/lib/format.ts (create if it doesn't exist)
export function formatMoney(amount: string, currency = "THB"): string {
  return new Intl.NumberFormat("th-TH", { style: "currency", currency }).format(
    Number(amount),
  );
}
```

### Pagination (list pages)

Use URL search params for page state so links are shareable:

```typescript
export const load: PageServerLoad = async ({ fetch, url }) => {
  const page = Number(url.searchParams.get("page") ?? "1");
  const limit = 25;
  const res = await fetch(
    `${env.WALLET_API_URL}/path?page=${page}&limit=${limit}`,
    { headers: { Authorization: `Bearer ${env.WALLET_API_KEY}` } },
  );
  return { ...(await res.json()), page };
};
```

### Type Checking Note

Run `pnpm check` before committing. There are ~44 pre-existing type errors in the repo — only fix errors introduced by your changes.

Use `ReturnType<typeof setTimeout>` (not `window.setTimeout`) for timer types.

## Output

Generate all files needed: `+page.svelte`, `+page.server.ts`, and any new `src/lib/` utilities. Show full file contents.
