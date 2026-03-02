# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

# Celta — Guía para Claude Code

## Arquitectura General

Monorepo con Turborepo + Bun. Dos aplicaciones principales:
- `apps/web` — Frontend Next.js 15 (App Router, TypeScript, Tailwind CSS v4)
- `apps/api` — Backend Elysia REST API (Bun, TypeScript)

Paquetes compartidos:
- `packages/typescript-config` — Configs de TypeScript base (base, nextjs, elysia)
- `packages/eslint-config` — Reglas ESLint compartidas

Documentación detallada:
- `docs/architecture.md` — Diagrama de capas y responsabilidades
- `docs/conventions.md` — Naming, patrones, manejo de errores

---

## Comandos Principales

```bash
# Desarrollo (ambas apps en paralelo)
bun run dev

# Build completo
bun run build

# Lint todo el monorepo
bun run lint

# Check de tipos
bun run check-types

# Limpiar artefactos de build
bun run clean

# Por app individual
cd apps/web && bun run dev    # http://localhost:3000
cd apps/api && bun run dev    # http://localhost:3001
```

No hay tests configurados actualmente en el proyecto.

---

## Dónde vive cada responsabilidad

| Responsabilidad | Ubicación |
|---|---|
| Páginas y rutas UI | `apps/web/app/` |
| Componentes React | `apps/web/components/` |
| Llamadas a la API | `apps/web/lib/api.ts` |
| Rutas HTTP | `apps/api/src/routes/` |
| Lógica de negocio | `apps/api/src/controllers/` |
| Tipos y esquemas | `apps/api/src/models/` |
| Auth, logging middleware | `apps/api/src/middleware/` |
| Config TypeScript | `packages/typescript-config/` |
| Config ESLint | `packages/eslint-config/` |

---

## Reglas: Cuándo Crear vs Editar

**Editar siempre que sea posible.** Crear archivo nuevo sólo cuando:
- Es una nueva página/ruta en Next.js (`app/nueva-ruta/page.tsx`)
- Es un nuevo recurso en la API (requiere route + controller + model)
- Es un nuevo componente reutilizable

**Nunca crear:**
- Helpers one-off — usar funciones inline
- Archivos de configuración adicionales sin justificación clara
- Duplicados de lógica existente

---

## Reglas de Código

- TypeScript estricto en todo el proyecto
- Sin `any` explícito — usar `unknown` + type guards cuando sea necesario
- Preferir `type` sobre `interface` para objetos de datos
- Imports con alias `@/` en Next.js
- Respuestas API siempre con estructura `{ data: T, error: string | null, meta? }`
- Variables de entorno sólo desde `.env` (nunca hardcoded); en Bun usar `Bun.env.VAR`
- Commits en formato Conventional Commits con scope de app: `feat(web):`, `fix(api):`, `chore(root):`, etc.

---

## Patrones Clave

### API: Esquemas de modelos

Los schemas en `apps/api/src/models/` envuelven la forma completa de la respuesta (incluyendo `data` y `error`):

```ts
import { t } from "elysia";

export const userResponse = t.Object({
  data: t.Object({ id: t.String(), name: t.String() }),
  error: t.Nullable(t.String()),
});
```

### API: Documentación Swagger en rutas

Pasar `detail` a cada handler de ruta para que aparezca en `/docs`:

```ts
userRoute.get("/", () => userController.getAll(), {
  response: userListResponse,
  detail: { tags: ["Users"], summary: "List all users" },
});
```

### API: Tipo `App` exportado

`apps/api/src/index.ts` exporta `export type App = typeof app`. Este tipo puede usarse con Eden Treaty para un cliente HTTP type-safe desde `apps/web`.

### Web: Clientes HTTP

- `apiServer()` — Server Components y Route Handlers (usa `API_URL`)
- `apiClient()` — Client Components (usa `NEXT_PUBLIC_API_URL`)
- Ambos auto-prefijan `/api/v1` a todos los paths

### Web: Server vs Client Components

Por defecto usar Server Components (sin `"use client"`). Agregar `"use client"` sólo para `useState`, `useEffect`, event handlers, o APIs del browser.

---

## Ports por defecto

- `apps/web` → `http://localhost:3000`
- `apps/api` → `http://localhost:3001`
- `apps/api` docs → `http://localhost:3001/docs`

---

## Flujo de Git

Ramas permanentes:
- `main` — producción, nunca se toca directamente
- `develop` — rama de integración, base de todo el trabajo

Flujo obligatorio para cada cambio:
1. Crear rama desde `develop`: `git checkout -b feat/nombre` (o `fix/`, `chore/`)
2. Hacer commits con scope correcto (ver Reglas de Código)
3. Mergear a `develop` y subir: `git push origin develop`
4. Para producción: `develop` → `main` (solo cuando esté estable)

Scopes de commit según app:
- `(web)` → cambios en `apps/web`
- `(api)` → cambios en `apps/api`
- `(root)` → cambios raíz (turbo, configs globales)
- `(packages)` → cambios en paquetes compartidos

**El agente nunca debe hacer push directo a `main`.**

---

## Ver también

- `apps/web/CLAUDE.md` — Patrones específicos de Next.js
- `apps/api/CLAUDE.md` — Patrones específicos de Elysia (checklist para nuevo recurso)
- `docs/architecture.md` — Diagrama completo de capas
- `docs/conventions.md` — Convenciones de código, naming, manejo de errores
