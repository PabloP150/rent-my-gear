# Test Results — Rent my Gear

**Run date:** 2026-04-16  
**Framework:** Vitest 4.1.4 + React Testing Library 16.3.2  
**Result:** ✅ 80 / 80 tests passed — 6 test files — 1.67 s

---

## Summary

| File | Tests | Result |
|------|------:|-------|
| `src/lib/date-utils.test.ts` | 29 | ✅ Pass |
| `src/components/features/RentalFlow/RentalFlow.test.tsx` | 5 | ✅ Pass |
| `src/components/features/RentalFlow/RentalFlow.integration.test.tsx` | 23 | ✅ Pass |
| `src/components/features/GearImage.test.tsx` | 11 | ✅ Pass |
| `src/services/imageService.test.ts` | 3 | ✅ Pass |
| `src/services/inventoryService.test.ts` | 9 | ✅ Pass |
| **Total** | **80** | ✅ **All pass** |

---

## 1. Unit Tests — `src/lib/date-utils.ts`

**File:** `src/lib/date-utils.test.ts` — 29 tests

These tests validate every exported function with deterministic inputs, covering the edge cases most likely to hide regressions.

### `calculateDays` (7 tests)

| Test | Input | Expected | Result |
|------|-------|----------|--------|
| Single-day rental | from = to = May 1 | 1 day | ✅ |
| Exactly one week | May 1–7 | 7 days | ✅ |
| Two weeks | Jun 1–14 | 14 days | ✅ |
| Full month | Jun 1–30 | 30 days | ✅ |
| Cross-month boundary | Jan 28 → Feb 3 | 7 days | ✅ |
| Cross-year boundary | Dec 29 → Jan 2 | 5 days | ✅ |
| Reversed range | May 10 → May 1 | 0 (clamped) | ✅ |

**Key finding:** `differenceInCalendarDays` returns the *difference* between two dates, not the *count* of days. Without the `+ 1` correction, a Mon–Wed rental returns 2 instead of 3. The tests anchor this invariant so a future change cannot silently regress it.

### `calculatePrice` (10 tests)

| Test | Scenario | Result |
|------|----------|--------|
| 1-day at $500 | subtotal $500, tax $60, total $560 | ✅ |
| 3-day at $100 | subtotal $300, tax $36, total $336 | ✅ |
| 7-day at $850 | subtotal $5,950, tax $714, total $6,664 | ✅ |
| 8+ day rental | No cap — 8 days accepted | ✅ |
| 30-day rental | subtotal $4,500, total $5,040 | ✅ |
| Cross-month (Jan 28 → Feb 3) | 7 days × $200 = $1,568 total | ✅ |
| Tax rate invariant | `tax / subtotal === 0.12` exactly | ✅ |
| Decimal daily rate ($333.33) | No floating-point blowup | ✅ |
| Reversed range | subtotal = 0, total = 0 | ✅ |
| `dailyRate` in breakdown | Exposed for UI display | ✅ |

### `isAvailableDate`, `isValidRange`, `formatCurrency`, `formatDateEs` (12 tests)

All helpers pass. Notable detail for `formatDateEs`: date strings like `new Date("2026-05-01")` parse as UTC midnight and shift to April 30 in UTC-6 (Mexico). Tests use `new Date(year, month, day, 12)` (local noon) to stay timezone-safe.

---

## 2. Integration Tests — RentalFlow Wizard

**File:** `src/components/features/RentalFlow/RentalFlow.integration.test.tsx` — 23 tests

These tests exercise the full multi-step rental wizard in a jsdom environment. The `Calendar` (DayPicker) component is replaced with a simple mock button that injects a fixed date range (`2026-06-01 → 2026-06-07`), isolating the wizard state machine from complex calendar interactions.

### Wizard navigation (7 tests)

| Test | Result |
|------|--------|
| Starts on Selection step, shows gear name | ✅ |
| Renders all four step labels (Equipo / Fechas / Resumen / Confirmación) | ✅ |
| "Seleccionar fechas" advances to Configuration | ✅ |
| "Atrás" returns from Configuration to Selection | ✅ |
| Selecting dates and clicking "Continuar" advances to Summary | ✅ |
| Filling valid customer data advances to Confirmation | ✅ |
| Submitting empty customer data shows validation error | ✅ |

### `StepConfirmation` — success path (6 tests)

All tests mock `global.fetch` to return `{ rentalId: "RMG-ABCD1234" }`.

| Test | Result |
|------|--------|
| Summary details (gear, customer name) visible before confirming | ✅ |
| "Confirmar Renta" button is enabled with valid state | ✅ |
| Button shows "Procesando…" spinner and becomes disabled while fetching | ✅ |
| Transitions to confirmed view and displays `rentalId` | ✅ |
| Success toast fired with `variant: "success"` and `title: "¡Renta confirmada!"` | ✅ |
| "Volver al inicio" button appears after confirmation | ✅ |

### `StepConfirmation` — error path (2 tests)

| Test | Result |
|------|--------|
| API error → destructive toast + button resets to "pending" (user can retry) | ✅ |
| Network failure (fetch throws) → destructive toast, button recovers | ✅ |

### Category coverage (3 tests — regression guard for Bug 3)

Each test confirms that the "Confirmar Renta" button transitions out of loading state for every category. This is a direct regression guard against the `deportes-acuaticos` silent early-return bug.

| Category | Result |
|----------|--------|
| `fotografia-video` | ✅ Confirmed |
| `montana-camping` | ✅ Confirmed |
| `deportes-acuaticos` | ✅ Confirmed (was permanently stuck before fix) |

---

## 3. Edge Cases — Nano Banana / GearImage Fallback

**File:** `src/components/features/GearImage.test.tsx` — 11 tests

These tests document the full image resolution decision tree, including what happens when Unsplash serves a broken URL.

### Image resolution behaviour

```
src prop
├── truthy URL (Unsplash)
│   ├── loads successfully → renders <Image> (Next.js)      ← tested
│   └── fails (404 / network) → Camera placeholder          ← tested
│       └── Nano Banana NOT called (no auto-regeneration)   ← tested
├── null / undefined
│   ├── calls GET /api/generate-image?gearId=...            ← tested
│   ├── API returns data URL  → renders <img> directly      ← tested
│   ├── API returns no URL   → Camera placeholder           ← tested
│   └── API throws           → Camera placeholder           ← tested
└── data:... URL (already generated)
    ├── renders <img> (not Next.js Image)                   ← tested
    └── Nano Banana NOT called                              ← tested
```

### Key finding — Unsplash 404 does NOT trigger regeneration

When an Unsplash URL is present in the inventory but the CDN returns 404, the `onError` handler on the `<img>` sets `error = true`, which renders the camera placeholder icon. The component does **not** automatically fall back to Nano Banana in this case. Regeneration only occurs when `imageURL` is explicitly `null` in `inventory.json`. This is intentional — silently re-generating on every 404 could trigger expensive Gemini calls in a loop during transient network issues.

| Test | Result |
|------|--------|
| Unsplash URL renders image directly | ✅ |
| Unsplash URL: fetch not called | ✅ |
| Unsplash 404 (onError) → camera placeholder | ✅ |
| Unsplash 404 → Nano Banana NOT triggered | ✅ |
| null src → loading skeleton shown | ✅ |
| null src → `/api/generate-image?gearId=da-011` called | ✅ |
| null src → data URL rendered after API responds | ✅ |
| null src + API returns no URL → camera placeholder | ✅ |
| null src + API throws → camera placeholder | ✅ |
| data URL → `<img>` rendered (not Next.js Image) | ✅ |
| data URL → Nano Banana not called | ✅ |

---

## Bugs Caught by This Suite

| Bug | Test that catches it |
|-----|---------------------|
| Off-by-one in `calculateDays` (missing `+ 1`) | `calculatePrice > prices a 1-day rental correctly — catches off-by-one` |
| Zod schema rejecting rentals > 7 days | `calculatePrice > allows rentals longer than 7 days — no artificial cap` |
| `deportes-acuaticos` button stuck in loading | `StepConfirmation — category coverage > confirms rental for category 'deportes-acuaticos'` |

---

## Running the Tests

```bash
# Run all tests once
npm run test:run

# Watch mode (re-runs on file save)
npm run test

# Single file
npx vitest run src/lib/date-utils.test.ts
npx vitest run src/components/features/RentalFlow/RentalFlow.integration.test.tsx
npx vitest run src/components/features/GearImage.test.tsx
```
