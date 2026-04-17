# Architecture — Rent my Gear

## Table of Contents

1. [Overview](#overview)
2. [Tech Stack](#tech-stack)
3. [Directory Structure](#directory-structure)
4. [Layered Architecture](#layered-architecture)
5. [Request Lifecycle](#request-lifecycle)
6. [Data Model](#data-model)
7. [Validation Strategy](#validation-strategy)
8. [Caching](#caching)
9. [Error Boundaries](#error-boundaries)
10. [Environment Configuration](#environment-configuration)

---

## Overview

Rent my Gear is a Next.js 16+ App Router application. It has no database — inventory lives in `src/data/inventory.json`, loaded at runtime and cached in memory. Missing product images are generated on demand via the Gemini API (branded internally as "Nano Banana"). Google Cloud Storage is an optional upgrade path for persisting generated images.

The UI is in Spanish. All code, identifiers, and comments are in English.

---

## Tech Stack

| Concern | Library | Version |
|---------|---------|---------|
| Framework | Next.js (App Router) | 16.2.4 |
| Language | TypeScript (strict) | 6.0.3 |
| UI | React | 19.2.5 |
| Styling | Tailwind CSS v4 | 4.2.2 |
| Components | shadcn/ui + Radix UI | — |
| Validation | Zod | 4.3.6 |
| Dates | date-fns | 4.1.0 |
| Icons | Lucide React | — |
| AI Images | Gemini 2.0 Flash (image generation) | — |
| Storage | Google Cloud Storage | — |
| Testing | Vitest + React Testing Library | 4.1.4 / 16.3.2 |

---

## Directory Structure

```
/
├── src/
│   ├── app/                        # Next.js App Router
│   │   ├── layout.tsx              # Root HTML, sticky nav, Toaster
│   │   ├── page.tsx                # Home: HeroCarousel + CategoryButtons
│   │   ├── error.tsx               # Global error boundary
│   │   ├── loading.tsx             # Global loading skeleton
│   │   ├── not-found.tsx           # 404 page
│   │   ├── globals.css             # Tailwind imports + CSS variables
│   │   ├── category/[id]/          # Category inventory grid
│   │   │   ├── page.tsx            # Statically generated per category
│   │   │   ├── loading.tsx
│   │   │   └── error.tsx
│   │   ├── gear/[id]/              # Gear detail + RentalFlow wizard
│   │   │   ├── page.tsx
│   │   │   ├── loading.tsx
│   │   │   └── error.tsx
│   │   └── api/
│   │       ├── generate-image/route.ts   # GET|POST image resolution
│   │       └── rental/route.ts           # POST create rental
│   │
│   ├── components/
│   │   ├── ui/                     # shadcn/ui primitives
│   │   │   ├── badge.tsx
│   │   │   ├── button.tsx
│   │   │   ├── calendar.tsx        # DayPicker wrapper (Spanish locale)
│   │   │   ├── card.tsx
│   │   │   ├── input.tsx
│   │   │   ├── separator.tsx
│   │   │   ├── toast.tsx
│   │   │   └── toaster.tsx
│   │   └── features/
│   │       ├── CategoryButtons.tsx
│   │       ├── GearGrid.tsx        # Searchable inventory grid
│   │       ├── GearImage.tsx       # Smart image with Nano Banana fallback
│   │       ├── HeroCarousel.tsx    # Auto-rotating featured items
│   │       └── RentalFlow/         # 4-step rental wizard
│   │           ├── index.tsx       # Wizard shell + step indicator
│   │           ├── StepSelection.tsx
│   │           ├── StepConfiguration.tsx
│   │           ├── StepSummary.tsx
│   │           └── StepConfirmation.tsx
│   │
│   ├── services/
│   │   ├── inventoryService.ts     # Gear CRUD + Fisher-Yates shuffle
│   │   ├── imageService.ts         # Gemini image generation + persistence
│   │   └── storageService.ts       # GCS upload/delete wrapper
│   │
│   ├── lib/
│   │   ├── validation.ts           # All Zod schemas and inferred types
│   │   ├── date-utils.ts           # Price calculation, date helpers
│   │   └── utils.ts                # cn() — clsx + tailwind-merge
│   │
│   ├── config/
│   │   └── env.ts                  # Lazy Zod env validation + singleton
│   │
│   ├── hooks/
│   │   └── use-toast.ts            # Toast state via listener pattern
│   │
│   ├── data/
│   │   └── inventory.json          # 50 items — source of truth
│   │
│   └── test/
│       └── setup.tsx               # Vitest globals + Next.js mocks
│
├── scripts/
│   ├── setup_gcs.py                # GCS bucket creation + smoke test
│   └── generate_inventory.py       # Populate imageURLs from Unsplash
│
├── docs/                           # Technical documentation
└── .env.local                      # Secrets (git-ignored)
```

---

## Layered Architecture

```
┌─────────────────────────────────────────────────────────┐
│                   Presentation Layer                    │
│   src/app/ pages    src/components/features/            │
│   (Server Components + "use client" islands)            │
└──────────────────────────┬──────────────────────────────┘
                           │  calls
┌──────────────────────────▼──────────────────────────────┐
│                  Business Logic Layer                   │
│   src/services/   (inventoryService, imageService)      │
│   src/lib/        (date-utils, validation)              │
└──────────────────────────┬──────────────────────────────┘
                           │  reads/writes
┌──────────────────────────▼──────────────────────────────┐
│                     Data Layer                          │
│   src/data/inventory.json   (in-memory cache, 5-min TTL)│
│   Google Cloud Storage      (optional image persistence)│
│   Gemini API                (on-demand image generation)│
└─────────────────────────────────────────────────────────┘
```

### Key rule

Pages and components **never** touch `inventory.json` directly. They always go through the service layer. The only exception is `imageService.ts`, which writes back generated image URLs to `inventory.json` for permanent persistence.

---

## Request Lifecycle

### Page render (Server Component)

```
Browser GET /category/fotografia-video
  → Next.js App Router matches src/app/category/[id]/page.tsx
  → page.tsx calls getGearByCategory("fotografia-video")
  → inventoryService loads/caches inventory.json
  → Returns GearItem[] — validated against gearItemSchema
  → React renders GearGrid as a Server Component
  → HTML streamed to browser
  → "use client" components (GearGrid search, GearImage) hydrate
```

### Image generation (Client → API → Gemini)

```
GearImage mounts with src=null
  → useEffect fires: GET /api/generate-image?gearId=da-011
  → API route calls resolveImageUrl("da-011", "Garmin Descent Mk3i")
  → imageService finds item in inventory — imageURL is null
  → POST to Gemini API with product photography prompt
  → Gemini returns base64-encoded image
  → imageService returns data:image/webp;base64,...
  → API responds with { imageURL }
  → GearImage sets state → renders <img src={dataUrl} />
```

### Rental confirmation

```
User fills wizard → clicks "Confirmar Renta"
  → StepConfirmation POST /api/rental
  → API validates body with rentalRequestRefinedSchema
  → Checks gear exists and is available
  → Generates rentalId: RMG-<UUID[:8].toUpperCase()>
  → Returns { rentalId, message, gear, startDate, endDate }
  → StepConfirmation shows success state + fires toast
```

---

## Data Model

### `GearItem` (from `src/lib/validation.ts`)

```typescript
{
  id:          string          // "fv-001", "mc-018", "da-011"
  name:        string          // Human-readable name (Spanish OK)
  category:    Category        // "fotografia-video" | "montana-camping" | "deportes-acuaticos"
  description: string
  dailyRate:   number          // MXN, positive
  imageURL:    string | null | undefined   // Unsplash URL, data URL, or null
  specs:       Record<string, string>      // Key-value pairs for detail page
  available:   boolean
}
```

### `RentalRequest`

```typescript
{
  gearId:        string    // Must match an existing GearItem
  startDate:     string    // ISO 8601, must be >= today
  endDate:       string    // ISO 8601, must be > startDate
  customerName:  string    // Min 2 characters
  customerEmail: string    // Valid email format
}
```

### ID Conventions

| Prefix | Category |
|--------|----------|
| `fv-` | fotografia-video |
| `mc-` | montana-camping |
| `da-` | deportes-acuaticos |

Items `da-011–da-015`, `mc-018–mc-019`, `fv-018` have `imageURL: null` — these trigger Nano Banana generation.

---

## Validation Strategy

Zod is the single validation layer. The same schema validates API bodies, inventory data, and provides TypeScript types via `z.infer<>`.

```
API boundary        → safeParse() with structured errors returned as JSON
Inventory load      → parse() — throws on startup if data is corrupt
Environment vars    → parse() inside getEnv() — throws with descriptive message
Frontend forms      → manual regex + length checks in StepSummary (not Zod)
```

All API error responses use the first `result.error.issues[0].message` so the client always receives a single human-readable message.

---

## Caching

| Resource | Strategy | TTL |
|----------|----------|-----|
| Inventory data | Module-level `_cache` array | 5 minutes |
| Environment vars | Module-level `_env` singleton | Process lifetime |
| Generated images | Written to `inventory.json` | Permanent |
| GCS images | Public bucket URL | Permanent |

The 5-minute inventory cache means a newly generated image URL written to `inventory.json` won't be seen by `inventoryService` until the next cache expiry. This is acceptable because `imageService` reads `inventory.json` directly (bypassing the cache) to check for existing URLs.

---

## Error Boundaries

Three nested boundaries, each with a retry button:

```
src/app/error.tsx                    ← catches everything
  src/app/category/[id]/error.tsx    ← catches category page errors
    src/app/gear/[id]/error.tsx      ← catches gear detail errors
```

Client-side errors within `StepConfirmation` are caught with try/catch and surfaced via the toast system — they do not bubble to the error boundary.

---

## Environment Configuration

`src/config/env.ts` uses a lazy singleton:

```typescript
let _env: z.infer<typeof envSchema> | null = null;

export function getEnv() {
  if (!_env) {
    const result = envSchema.safeParse(process.env);
    if (!result.success) throw new Error(...);
    _env = result.data;
  }
  return _env;
}
```

This means:
- No crash at build time if env vars are absent (useful for CI without secrets)
- Crash happens at the first **runtime** call that needs the variable
- GCS vars are `optional()` — `storageService` guards them with `requireGcsEnv()`
- `NANO_BANANA_API_KEY` is required at runtime for any image generation
