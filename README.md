# Rent my Gear

Marketplace premium de renta de equipo construido con Next.js 16+ (App Router),
Tailwind v4 y shadcn/ui. Incluye una estrategia de imágenes con fallback a
Nano Banana (Gemini) y persistencia opcional en Google Cloud Storage.

## Tech stack

- **Framework:** Next.js 16+ (App Router, Server Components)
- **UI:** Tailwind CSS v4 + shadcn/ui
- **Validación:** Zod (datos y variables de entorno)
- **Imágenes:** `imageURL` estático → Nano Banana (Gemini) → GCS público
- **Tests:** Vitest + Testing Library + jsdom
- **Idioma:** UI en español; código y comentarios en inglés

## Setup

```bash
# 1. Instalar dependencias
npm install

# 2. Configurar variables de entorno
cp .env.example .env.local
# Edita .env.local y agrega tu NANO_BANANA_API_KEY.
# GCS es opcional: sin él, las imágenes generadas se devuelven como data URLs.

# 3. Dev server
npm run dev

# 4. Tests
npm test
```

## Arquitectura en capas

```
Presentación  → src/app/ (rutas), src/components/
Lógica de negocio → src/services/
Datos         → src/data/inventory.json, GCS, Gemini
Configuración → src/config/env.ts (Zod)
Validación    → src/lib/validation.ts (Zod)
```

### Rutas

- `/` — Home con carrusel de 5 items aleatorios y 3 botones de categoría.
- `/category/[id]` — Grid filtrable con búsqueda en tiempo real.
- `/gear/[id]` — Detalle del item + flujo de renta multi-step.
- `/api/rental` — POST. Valida con `rentalRequestSchema` y simula la confirmación.
- `/api/generate-image` — GET/POST. Genera con Nano Banana y opcionalmente sube a GCS.

### Flujo de renta

```
selection → configuration → summary → confirmation
```

Cada paso vive en `src/components/features/RentalFlow/RentalFlow.tsx`.

### Estrategia de imágenes

1. Si el item ya trae `imageURL`, se usa directo.
2. Si es `null`, el cliente pide `/api/generate-image?id=...&name=...`.
3. La API llama a Nano Banana (`gemini-2.0-flash-preview-image-generation`).
4. Si GCS está configurado, el binario se sube y la URL pública se devuelve.
5. Si no, se devuelve un `data:` URL (funciona igual en `<Image unoptimized />`).

## Datos

`src/data/inventory.json` contiene 50 items:

- 17 en *Fotografía y Video*
- 17 en *Montaña y Camping*
- 16 en *Deportes Acuáticos*
- 8 items sin `imageURL` para forzar el fallback de Nano Banana

Para regenerarlo con URLs reales de Unsplash:

```bash
cd scripts
uv sync
UNSPLASH_ACCESS_KEY=... uv run generate_inventory.py --unsplash
```

## GCS (opcional)

```bash
cd scripts
uv sync
uv run setup_gcs.py   # crea bucket, aplica IAM pública y hace smoke test
```

## Tests

```bash
npm test             # CI
npm run test:watch   # desarrollo
npm run test:coverage
```
