# Rent My Gear

Premium equipment rental marketplace for photography, mountaineering, and water sports gear.

## Documentation

| Document | Description |
|----------|-------------|
| [docs/architecture.md](docs/architecture.md) | System overview, layered architecture, data model, request lifecycle, caching, error boundaries |
| [docs/image-resolution.md](docs/image-resolution.md) | Mermaid sequence diagrams for the full image resolution flow (JSON → Nano Banana → GCS) |
| [docs/services.md](docs/services.md) | Mermaid class diagram for `inventoryService` and `imageService`; full API reference for all service methods |
| [docs/onboarding.md](docs/onboarding.md) | New developer guide: mental models, key patterns, debugging GCS, adding a new category |
| [docs/test-results.md](docs/test-results.md) | Full test run report: 80 tests across 6 files, bug regression table, edge case findings |

---

## Features

- **Hero Carousel** — 5 random featured items with auto-play
- **Category browsing** — Fotografía y Video, Montaña y Camping, Deportes Acuáticos
- **Real-time search** — Filter gear within any category
- **Rental flow wizard** — 4-step process: Selection → Dates → Summary → Confirmation
- **AI image generation** — Missing images are generated via Nano Banana (Gemini) and persisted to GCS
- **Full validation** — Zod schemas on all inputs, environment variables, and API boundaries

---

## Setup

### 1. Clone and install dependencies

```bash
npm install
```

### 2. Environment variables

Create `.env.local` in the project root:

```env
GCS_BUCKET_NAME=your-bucket-name
GCS_PROJECT_ID=your-gcp-project-id
GOOGLE_APPLICATION_CREDENTIALS=/absolute/path/to/service-account.json
NANO_BANANA_API_KEY=your-nano-banana-key
```

> All four variables are required. The app throws a descriptive error on startup if any are missing.

### 3. Setup GCS bucket (first time)

```bash
# From the scripts/ directory, using uv:
cd scripts
uv run setup_gcs.py
```

This script creates the bucket, sets public access, and runs a smoke test.

### 4. (Optional) Re-generate inventory images from Unsplash

```bash
# Add UNSPLASH_ACCESS_KEY to .env first
cd scripts
uv run generate_inventory.py
```

### 5. Run the development server

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000).

---

## Architecture

```
src/
├── app/                        # Next.js App Router
│   ├── layout.tsx              # Root layout with nav + Toaster
│   ├── page.tsx                # Home: Carousel + Category buttons
│   ├── error.tsx / loading.tsx # Global boundaries
│   ├── category/[id]/          # Category inventory grid
│   ├── gear/[id]/              # Gear detail + RentalFlow
│   └── api/
│       ├── rental/route.ts     # POST — create rental
│       └── generate-image/     # GET/POST — resolve or generate image
│
├── components/
│   ├── ui/                     # shadcn/ui primitives (Button, Card, Calendar…)
│   └── features/
│       ├── HeroCarousel.tsx
│       ├── CategoryButtons.tsx
│       ├── GearGrid.tsx
│       ├── GearImage.tsx       # Image with NanoBanana fallback
│       └── RentalFlow/         # Multi-step wizard
│
├── services/
│   ├── inventoryService.ts     # CRUD + Fisher-Yates random, 5-min cache
│   ├── imageService.ts         # imageURL resolution + NanoBanana + GCS persist
│   └── storageService.ts       # GCS upload/delete wrapper
│
├── lib/
│   ├── validation.ts           # Zod schemas (GearItem, RentalRequest…)
│   ├── date-utils.ts           # Price calculation, date helpers
│   └── utils.ts                # cn() Tailwind merge
│
├── config/
│   └── env.ts                  # Lazy Zod env validation
│
└── data/
    └── inventory.json          # 50 mock items (8 without imageURL)
```

### Image Resolution Strategy

```
Client requests gear image
        │
        ▼
  imageURL present? ──Yes──▶ Serve from imageURL (CDN/Unsplash)
        │
        No
        ▼
  Call Nano Banana API (Gemini gemini-3-pro-image-preview)
        │
        ▼
  Upload base64 result to GCS
        │
        ▼
  Get public URL from GCS
        │
        ▼
  Persist URL to inventory.json ──▶ Return URL to client
```

---

## Testing

**80 tests — 6 files — all passing** (Vitest 4 + React Testing Library 16)

See [docs/test-results.md](docs/test-results.md) for the full report.

| Suite | Tests | Coverage |
|-------|------:|---------|
| `date-utils.test.ts` — unit tests for price calculation | 29 | `calculateDays`, `calculatePrice`, `formatDateEs`, `isAvailableDate` |
| `RentalFlow.integration.test.tsx` — full wizard flow | 23 | Navigation, success toast, error recovery, all 3 categories |
| `GearImage.test.tsx` — image fallback edge cases | 11 | Unsplash 404, null src, data URL, Nano Banana path |
| `imageService.test.ts` — Gemini API integration | 3 | Existing URL, Gemini call, Gemini error |
| `inventoryService.test.ts` — inventory CRUD | 9 | getAll, getById, getByCategory, search, random |
| `RentalFlow.test.tsx` — wizard unit tests | 5 | Step transitions |

```bash
npm run test:run      # Run all 80 tests once
npm run test          # Watch mode
npx vitest run src/lib/date-utils.test.ts
npx vitest run src/components/features/RentalFlow/RentalFlow.integration.test.tsx
npx vitest run src/components/features/GearImage.test.tsx
```

---

## Commands

```bash
npm run dev           # Development server
npm run build         # Production build
npm run lint          # ESLint
npm run test:run      # Run all tests once
npm run test          # Watch mode

# Python scripts (from scripts/)
uv run setup_gcs.py          # Create + configure GCS bucket
uv run generate_inventory.py # Populate imageURLs from Unsplash
```

---

## Categories

| ID | Display Name |
|----|-------------|
| `fotografia-video` | Fotografía y Video |
| `montana-camping` | Montaña y Camping |
| `deportes-acuaticos` | Deportes Acuáticos |

---

## Tech Stack

- **Framework**: Next.js 16+ (App Router, Server Components)
- **Styling**: Tailwind CSS v4 + shadcn/ui (Apple-inspired design)
- **Validation**: Zod (env vars, API inputs, inventory schema)
- **AI Images**: Nano Banana Pro (`gemini-3-pro-image-preview`)
- **Storage**: Google Cloud Storage
- **Testing**: Vitest + React Testing Library
- **Scripts**: Python 3.11+ with `uv` and `python-dotenv`
