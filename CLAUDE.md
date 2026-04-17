# Instrucciones para Claude

## Comandos

```bash
npm run dev
npm run build
npm run lint
npm test
npm run test:watch
npm run test:coverage
```

## Arquitectura

Capas:
- Presentación: `src/app/` (rutas), `src/components/`
- Lógica: `src/services/`
- Datos: `src/data/inventory.json`, Gemini, GCS
- Config: `src/config/env.ts` (Zod, lazy `getEnv()`)
- Validación: `src/lib/validation.ts` (Zod)

Servicios:
- `inventoryService`: lectura + cache en memoria (TTL 5m); `getRandomGear` usa Fisher-Yates.
- `imageService`: genera con Nano Banana; si GCS está configurado, sube y devuelve URL pública.
- `storageService`: wrapper thin sobre `@google-cloud/storage`.

Flujo de renta (state machine):
```
selection → configuration → summary → confirmation
```

Categorías (IDs fijos):
- `fotografia-video` → Fotografía y Video
- `montana-camping` → Montaña y Camping
- `deportes-acuaticos` → Deportes Acuáticos

Path aliases: `@/*` → `src/*`.

## Tests

Vitest + React Testing Library. Mocks de `next/image`, `next/link`, `next/navigation` en `src/test/setup.tsx`.
