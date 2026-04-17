# Onboarding Guide — Rent my Gear

Welcome to the project. This guide gets a new developer from zero to a running app, explains every architectural decision you'll encounter in the first week, and covers the two most common maintenance tasks: debugging GCS and adding a new category.

---

## Table of Contents

1. [Prerequisites](#1-prerequisites)
2. [First Run](#2-first-run)
3. [How the Codebase Is Organized](#3-how-the-codebase-is-organized)
4. [Mental Model: How a Page Renders](#4-mental-model-how-a-page-renders)
5. [Mental Model: How a Rental Is Processed](#5-mental-model-how-a-rental-is-processed)
6. [Mental Model: How Images Work](#6-mental-model-how-images-work)
7. [Key Patterns to Know](#7-key-patterns-to-know)
8. [Running and Writing Tests](#8-running-and-writing-tests)
9. [Debugging the GCS Connection](#9-debugging-the-gcs-connection)
10. [How to Add a New Category](#10-how-to-add-a-new-category)
11. [Common Mistakes](#11-common-mistakes)

---

## 1. Prerequisites

| Tool | Version | Install |
|------|---------|---------|
| Node.js | 20+ | `nvm use 20` |
| npm | 10+ | bundled with Node |
| Python | 3.11+ | for GCS/Unsplash scripts only |
| uv | latest | `pip install uv` |

You need one API key to run the app locally:

- **`NANO_BANANA_API_KEY`** — A Gemini API key from Google AI Studio. The free tier is sufficient for development.

GCS credentials are optional. The app runs fully without them; 8 of the 50 gear items will generate images via Gemini on first request instead of loading from a CDN.

---

## 2. First Run

```bash
# Clone and install
cd "semana 3"
npm install

# Create environment file
cat > .env.local << 'EOF'
NANO_BANANA_API_KEY=your_gemini_api_key_here
EOF

# Start development server
npm run dev
# → http://localhost:3000
```

The app starts without GCS. The first time you navigate to a gear item with a `null` imageURL (e.g., any item prefixed `da-011`), you'll see "Generando imagen…" for a few seconds while Gemini generates the image.

---

## 3. How the Codebase Is Organized

```
src/
├── app/          ← Next.js pages and API routes (routing layer)
├── components/   ← React UI (features/ for domain, ui/ for primitives)
├── services/     ← Business logic (never import in components directly)
├── lib/          ← Pure utilities: Zod schemas, date math, className helper
├── config/       ← Environment variable validation
├── hooks/        ← React hooks (currently just use-toast)
└── data/         ← inventory.json — the database
```

**The rule:** Data flows down. Pages call services. Services read/write `data/`. Components receive props from pages. Components should never `import inventoryService` directly — they get data as props from Server Components or via API fetch calls.

---

## 4. Mental Model: How a Page Renders

This project uses Next.js App Router with **React Server Components**. Understanding the split between server and client is essential.

### Server Components (no `"use client"`)

`src/app/page.tsx`, `src/app/category/[id]/page.tsx`, `src/app/gear/[id]/page.tsx` are all Server Components. They run **only on the server** (or at build time). They can:

- Directly call `inventoryService` functions
- Read the filesystem
- Import server-only modules

They **cannot** use `useState`, `useEffect`, browser APIs, or event handlers.

### Client Components (`"use client"`)

`GearImage`, `HeroCarousel`, `GearGrid`, and all of `RentalFlow/` are Client Components. They:

- Run on both server (for initial HTML) and client (for hydration and interactivity)
- Can use hooks and browser APIs
- Receive data via props from their parent Server Component
- Make `fetch()` calls to API routes when they need dynamic server data

### Why `HeroCarousel` had a hydration bug

Any value computed with `Math.random()` inside a component's render function will produce different results on server vs client, causing React to throw a hydration mismatch error and discard the server-rendered HTML. The fix is to compute random values inside `useEffect` (client-only) and initialize state with a deterministic value.

```typescript
// Wrong — runs on both server and client, produces different results
const [current, setCurrent] = useState(Math.floor(Math.random() * items.length));

// Correct — server and client both start at 0; randomness applied after hydration
const [current, setCurrent] = useState(0);
useEffect(() => {
  setCurrent(Math.floor(Math.random() * items.length));
}, []);
```

---

## 5. Mental Model: How a Rental Is Processed

The rental wizard is a **client-side state machine** in `src/components/features/RentalFlow/index.tsx`. No data is persisted to a server between steps — all state lives in React `useState`.

```
Step 1 — StepSelection
  → User views gear details
  → Clicks "Seleccionar fechas"
  → Parent sets step = "configuration"

Step 2 — StepConfiguration
  → User picks a date range via DayPicker calendar
  → Parent onUpdate() merges { startDate, endDate } into RentalState
  → Parent sets step = "summary"

Step 3 — StepSummary
  → User fills customerName and customerEmail
  → Local validation (regex + length) — no Zod here, intentionally simple
  → Parent onUpdate() merges customer data
  → Parent sets step = "confirmation"

Step 4 — StepConfirmation
  → Displays full summary with price breakdown
  → User clicks "Confirmar Renta"
  → POST /api/rental with full RentalState data
  → On success: shows confirmation card with rentalId
  → On error: toast + button resets for retry
```

The rental API currently generates a mock `rentalId` (`RMG-<8 hex chars>`) and logs to the console. There is no database write. Replacing this with a real database write means modifying only `src/app/api/rental/route.ts` — the rest of the system is unchanged.

---

## 6. Mental Model: How Images Work

See [image-resolution.md](image-resolution.md) for sequence diagrams. The short version:

1. **Inventory has a URL** → browser loads it directly, no API involved
2. **Inventory has `null`** → `GearImage` component calls `/api/generate-image` → Gemini generates and returns a base64 data URL → displayed immediately
3. **Image URL fails to load** (`onError`) → camera icon placeholder shown; Gemini is **not** re-triggered

The 8 items without images are: `da-011`, `da-012`, `da-013`, `da-014`, `da-015`, `mc-018`, `mc-019`, `fv-018`.

---

## 7. Key Patterns to Know

### Zod schemas as the single source of truth

Every type in the codebase is derived from a Zod schema:

```typescript
// In src/lib/validation.ts
export const gearItemSchema = z.object({ ... });
export type GearItem = z.infer<typeof gearItemSchema>;
```

Never write a manual TypeScript `interface` for data that passes through an API boundary. Add it to `validation.ts`, then `z.infer<>` it.

### `safeParse` for API boundaries, `parse` for trusted internal data

```typescript
// API route — user input might be wrong, handle gracefully
const result = rentalRequestRefinedSchema.safeParse(body);
if (!result.success) {
  return NextResponse.json({ error: result.error.issues[0].message }, { status: 422 });
}

// Inventory load — if this fails, the data file is corrupt and we want to crash loudly
const items = z.array(gearItemSchema).parse(rawJson);
```

### Lazy environment validation

`getEnv()` in `src/config/env.ts` validates on first call and caches. Never access `process.env` directly in application code — always go through `getEnv()`. This ensures a clear error message instead of a silent `undefined`.

```typescript
// Wrong
const key = process.env.NANO_BANANA_API_KEY;

// Right
const { NANO_BANANA_API_KEY } = getEnv();
```

### `cn()` for conditional class names

All Tailwind class composition goes through `cn()` from `src/lib/utils.ts`. It combines `clsx` (conditional classes) and `tailwind-merge` (deduplication):

```typescript
import { cn } from "@/lib/utils";

<div className={cn("base-class", isActive && "active-class", className)} />
```

### `@/` path alias

All imports from within `src/` use `@/`:

```typescript
import { GearItem } from "@/lib/validation";
import { getGearById } from "@/services/inventoryService";
```

Never use relative paths like `../../services/inventoryService`.

---

## 8. Running and Writing Tests

```bash
npm run test:run          # Run all 80 tests once (CI mode)
npm run test              # Watch mode — re-runs on save
npx vitest run <file>     # Single file
```

Tests live next to the files they test:

```
src/lib/date-utils.ts
src/lib/date-utils.test.ts          ← unit tests

src/services/imageService.ts
src/services/imageService.test.ts   ← unit tests with mocked fetch

src/components/features/GearImage.tsx
src/components/features/GearImage.test.tsx  ← component tests

src/components/features/RentalFlow/
├── index.tsx
├── RentalFlow.test.tsx              ← step navigation unit tests
└── RentalFlow.integration.test.tsx ← full wizard + API integration tests
```

### What is mocked in every test

`src/test/setup.tsx` globally mocks three Next.js modules that don't work in jsdom:

| Module | Mock |
|--------|------|
| `next/navigation` | `useRouter` returns `{ push, back, replace }` as `vi.fn()` |
| `next/image` | Rendered as a plain `<img>` tag |
| `next/link` | Rendered as a plain `<a>` tag |

Any test that renders a component using `useToast` should mock it locally:

```typescript
const mockToast = vi.fn();
vi.mock("@/hooks/use-toast", () => ({
  useToast: () => ({ toast: mockToast }),
}));
```

### Writing a test for a new service method

```typescript
import { describe, it, expect, beforeEach } from "vitest";
import { resetCache, getAvailableGear } from "./inventoryService";

describe("getAvailableGear", () => {
  beforeEach(() => resetCache());

  it("returns only items where available === true", () => {
    const items = getAvailableGear();
    expect(items.every((i) => i.available)).toBe(true);
  });
});
```

---

## 9. Debugging the GCS Connection

GCS is optional. You only need this section if you are enabling image persistence (Option A).

### Step 1 — Verify environment variables

```bash
node -e "
const { getEnv } = require('./src/config/env.ts');
const env = getEnv();
console.log('GCS_BUCKET_NAME:', env.GCS_BUCKET_NAME);
console.log('GCS_PROJECT_ID:', env.GCS_PROJECT_ID);
console.log('GOOGLE_APPLICATION_CREDENTIALS:', env.GOOGLE_APPLICATION_CREDENTIALS);
"
```

If this throws, the variable is missing or misformatted. Check `.env.local` for typos and ensure there are no quotes around values.

### Step 2 — Verify the service account key file

```bash
# The key file must exist at the path specified in GOOGLE_APPLICATION_CREDENTIALS
cat "$GOOGLE_APPLICATION_CREDENTIALS" | python3 -m json.tool | head -5
# Expected output: { "type": "service_account", "project_id": "...", ...
```

If the file doesn't exist or is malformed JSON, the GCS client will throw `Error: Could not load the default credentials`.

### Step 3 — Run the smoke test script

```bash
cd scripts
uv run setup_gcs.py
```

The script performs:
1. Bucket existence check — creates if missing
2. `allUsers` + `storage.objectViewer` IAM binding (makes objects public)
3. Upload a test file (`rmg-smoke-test.txt`)
4. Verify public URL is accessible via `requests.get()`
5. Delete the test file

Common errors and their fixes:

| Error | Cause | Fix |
|-------|-------|-----|
| `403 Forbidden` | Service account lacks Storage Admin role | Grant `roles/storage.admin` in GCP IAM |
| `404 bucket not found` | Bucket doesn't exist | Script creates it — check `GCS_PROJECT_ID` |
| `public URL returns 403` | Uniform bucket-level access prevents per-object ACLs | Disable "Enforce public access prevention" on the bucket in GCP Console |
| `GOOGLE_APPLICATION_CREDENTIALS not set` | Variable not in `.env.local` or wrong path | Use absolute path, verify file exists |

### Step 4 — Verify from the API route

Add a temporary log to `src/services/storageService.ts` to confirm the client initializes:

```typescript
function getStorage(): Storage {
  if (!_storage) {
    const env = requireGcsEnv();
    console.log("[storageService] Initializing GCS for project:", env.GCS_PROJECT_ID);
    _storage = new Storage({ ... });
  }
  return _storage;
}
```

Then trigger a request to `/api/generate-image?gearId=da-011` and watch the terminal. Remove the log before committing.

### Step 5 — Check if images are persisting

After a successful GCS upload, `imageService.persistImageUrl()` writes back to `inventory.json`. Verify:

```bash
node -e "
const inv = require('./src/data/inventory.json');
const item = inv.find(i => i.id === 'da-011');
console.log(item.imageURL);
// Should be: https://storage.googleapis.com/<bucket>/gear/da-011.webp
"
```

If it still shows `null`, check that `persistImageUrl` is not hitting its early-return guard (`imageURL.startsWith("data:")`) — which it shouldn't, since GCS returns an HTTPS URL.

---

## 10. How to Add a New Category

Adding a category requires changes in **five places**. Miss any one and you'll either get a runtime error or a TypeScript compile error that points you to the right place.

### The five places

#### 1. `src/lib/validation.ts` — extend the enum

```typescript
export const categorySchema = z.enum([
  "fotografia-video",
  "montana-camping",
  "deportes-acuaticos",
  "audio-iluminacion",   // ← add here
]);
```

The `Category` type is inferred — all downstream TypeScript types update automatically.

#### 2. `src/lib/validation.ts` — add the display label

```typescript
export const CATEGORY_LABELS: Record<Category, string> = {
  "fotografia-video": "Fotografía y Video",
  "montana-camping": "Montaña y Camping",
  "deportes-acuaticos": "Deportes Acuáticos",
  "audio-iluminacion": "Audio e Iluminación",  // ← add here
};
```

TypeScript's `Record<Category, string>` enforces exhaustiveness — the build will fail if you add to the enum without adding to `CATEGORY_LABELS`.

#### 3. `src/components/features/CategoryButtons.tsx` — add the UI card

```typescript
const CATEGORIES = [
  // ...existing entries
  {
    id: "audio-iluminacion" as Category,
    label: "Audio e Iluminación",
    description: "Micrófonos, grabadoras y sistemas de iluminación",
    icon: Mic,                          // import from lucide-react
    gradient: "from-yellow-500/10 to-amber-500/10",
    iconColor: "text-yellow-500",
  },
];
```

#### 4. `src/app/category/[id]/page.tsx` — add to static generation

```typescript
export function generateStaticParams() {
  return [
    { id: "fotografia-video" },
    { id: "montana-camping" },
    { id: "deportes-acuaticos" },
    { id: "audio-iluminacion" },        // ← add here
  ];
}
```

Without this entry, the category page won't be statically generated and will fall through to a 404.

#### 5. `src/data/inventory.json` — add items

Add gear items with the new category ID. Follow the existing naming convention (`al-001`, `al-002`, etc.) and match the schema exactly:

```json
{
  "id": "al-001",
  "name": "Rode NT-USB Mini",
  "category": "audio-iluminacion",
  "description": "Micrófono USB condensador compacto para grabación profesional",
  "dailyRate": 150,
  "imageURL": "https://images.unsplash.com/...",
  "specs": {
    "Patrón": "Cardioide",
    "Conexión": "USB-C",
    "Frecuencia": "20Hz-20kHz"
  },
  "available": true
}
```

### Verification checklist

After making all five changes:

```bash
# TypeScript must compile without errors
npx tsc --noEmit

# Tests must still pass (category-related tests use z.enum internally)
npm run test:run

# Dev server must show new category on homepage
npm run dev
# → Navigate to /category/audio-iluminacion
# → Should display items with correct label
```

### Why `categorySchema` must be updated first

The Zod enum is the **single source of truth** for what constitutes a valid category. Everything else (`CATEGORY_LABELS`, route params, inventory validation) derives from it. If you add items to `inventory.json` before updating the enum, `inventoryService` will throw on startup:

```
ZodError: Invalid enum value. Expected "fotografia-video" | "montana-camping" | "deportes-acuaticos", received "audio-iluminacion"
```

This is intentional — fail loudly at startup rather than silently serve wrong data.

---

## 11. Common Mistakes

### `new Date("2026-05-01")` in tests

This parses as UTC midnight. In any timezone behind UTC (e.g., Mexico City, UTC-6), it shifts to April 30. Use `new Date(2026, 4, 1, 12)` (local noon) in tests to stay timezone-safe.

### Accessing `process.env` directly

Always use `getEnv()`. Direct `process.env` access bypasses validation and returns `undefined` silently.

### Importing a service in a Client Component

Services like `inventoryService` use `fs` and other Node.js modules. Importing them in a `"use client"` component will crash the browser bundle. Pass data as props from the parent Server Component, or fetch via an API route.

### Forgetting `resetCache()` in service tests

`inventoryService` caches loaded data in module-level state. Without `resetCache()` in `beforeEach`, tests can contaminate each other depending on execution order.

### Adding to `CATEGORY_LABELS` without updating `categorySchema` (or vice versa)

TypeScript will catch this: `Record<Category, string>` requires every enum member to have an entry. But you must update the Zod enum *first* before TypeScript knows the new member exists.

### Expecting Gemini to regenerate on Unsplash 404

`GearImage` only calls the generate-image API when `src` is `null`. If a stored Unsplash URL starts returning 404, the component shows the camera placeholder — it does not auto-regenerate. To fix, set `imageURL: null` in `inventory.json` for the affected items so the next page load triggers generation.
