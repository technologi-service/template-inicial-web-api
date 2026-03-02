# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

# Celta — Guía para Claude Code

## Arquitectura General

Monorepo con Turborepo + Bun. Dos aplicaciones principales:
- `apps/web` — Frontend Next.js 16 (App Router, TypeScript, Tailwind CSS v4)
- `apps/api` — Backend Elysia REST API (Bun, TypeScript)

Paquetes compartidos:
- `packages/typescript-config` — Configs de TypeScript base (base, nextjs, elysia)
- `packages/eslint-config` — Reglas ESLint compartidas

Documentación detallada:
- `docs/architecture.md` — Diagrama de capas y responsabilidades
- `docs/conventions.md` — Naming, patrones, manejo de errores

---

## Stack Tecnológico

| Tecnología | Versión | Ubicación | Propósito |
|---|---|---|---|
| Turborepo | ^2.3 | raíz `turbo.json` | Orquestación del monorepo |
| Bun | >= 1.2 | runtime global | Package manager y runtime |
| Next.js | 16 | `apps/web/` | Frontend (App Router, RSC) |
| Tailwind CSS | v4 | `apps/web/` | Estilos (PostCSS) |
| Elysia | ^1.2 | `apps/api/` | Framework HTTP backend |
| Drizzle ORM | ^0.45 | `apps/api/src/db/` | ORM relacional |
| Neon Postgres | — | cloud | Base de datos serverless |
| Better Auth | ^1.5 | `apps/api/src/lib/auth.ts`, `apps/web/lib/auth/` | Autenticación (email + password) |
| Swagger | — | `apps/api/` plugin | Documentación interactiva de la API |

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

# Base de datos (Drizzle)
cd apps/api && bun run db:generate   # Generar migraciones
cd apps/api && bun run db:migrate    # Aplicar migraciones
cd apps/api && bun run db:push       # Push directo al schema
cd apps/api && bun run db:studio     # Explorador visual
```

No hay tests configurados actualmente en el proyecto.

---

## Dónde vive cada responsabilidad

| Responsabilidad | Ubicación |
|---|---|
| Páginas y rutas UI | `apps/web/app/` |
| Componentes React | `apps/web/components/` |
| Llamadas a la API | `apps/web/lib/api.ts` |
| Auth client (Better Auth) | `apps/web/lib/auth/client.ts` |
| Auth server (Better Auth) | `apps/web/lib/auth/server.ts` |
| Auth route handler | `apps/web/app/api/auth/[...all]/route.ts` |
| Auth middleware | `apps/web/middleware.ts` |
| Rutas HTTP | `apps/api/src/routes/` |
| Lógica de negocio | `apps/api/src/controllers/` |
| Tipos y esquemas | `apps/api/src/models/` |
| Auth config (Better Auth) | `apps/api/src/lib/auth.ts` |
| Auth plugin (Elysia) | `apps/api/src/middleware/auth.ts` |
| Database connection | `apps/api/src/db/index.ts` |
| Database schemas | `apps/api/src/db/schema.ts` |
| Drizzle config | `apps/api/drizzle.config.ts` |
| Logging middleware | `apps/api/src/middleware/logger.ts` |
| Config TypeScript | `packages/typescript-config/` |
| Config ESLint | `packages/eslint-config/` |

---

## Autenticación (Better Auth)

El proyecto usa **Better Auth** con email + password. La autenticación se maneja en dos lugares:

### En `apps/web` (frontend):
- **`lib/auth/server.ts`** — Instancia de Better Auth (server-side) con Drizzle adapter + `nextCookies` plugin
- **`lib/auth/client.ts`** — Cliente React (`createAuthClient` de `better-auth/react`)
- **`app/api/auth/[...all]/route.ts`** — Handler catch-all que monta Better Auth en Next.js
- **`middleware.ts`** — Middleware que protege `/account/*` verificando la cookie de sesión

### En `apps/api` (backend):
- **`src/lib/auth.ts`** — Instancia de Better Auth con Drizzle adapter + email/password
- **`src/middleware/auth.ts`** — Plugin Elysia que monta el handler y provee macro `auth`

### Proteger rutas en la API:
```ts
// Usar el macro `auth: true` para requerir autenticación
app.get("/perfil", ({ user }) => ({ data: user, error: null }), {
  auth: true,
});
```

### Obtener sesión en Server Components (Next.js):
```ts
import { auth } from "@/lib/auth/server";
import { headers } from "next/headers";

const session = await auth.api.getSession({ headers: await headers() });
```

### Usar auth en Client Components (React):
```tsx
import { authClient } from "@/lib/auth/client";

// Hook reactivo
const { data: session, isPending } = authClient.useSession();

// Sign in
await authClient.signIn.email({ email, password });

// Sign up
await authClient.signUp.email({ name, email, password });

// Sign out
await authClient.signOut();
```

---

## Base de Datos (Drizzle + Neon)

- **Conexión:** `apps/api/src/db/index.ts` — Pool de Neon Postgres con Drizzle ORM
- **Esquemas:** `apps/api/src/db/schema.ts` — Definiciones de tablas
- **Config:** `apps/api/drizzle.config.ts` — Migraciones en `./src/db/migrations`
- **Driver:** `@neondatabase/serverless` con `drizzle-orm/neon-serverless`

Better Auth crea automáticamente sus tablas (`user`, `session`, `account`, `verification`) al ejecutar `npx auth@latest generate` o `npx auth@latest migrate`.

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

### API: Rutas protegidas con Better Auth

Usar el macro `auth: true` en las opciones del handler:

```ts
userRoute.get("/me", ({ user }) => ({ data: user, error: null }), {
  auth: true,
  detail: { tags: ["Users"], summary: "Get current user" },
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

## Variables de Entorno

### `apps/web/.env.example`
| Variable | Propósito |
|---|---|
| `API_URL` | URL interna de la API (Server Components) |
| `NEXT_PUBLIC_API_URL` | URL pública de la API (Client Components) |
| `DATABASE_URL` | Conexión a Neon Postgres (para Better Auth server-side) |
| `BETTER_AUTH_SECRET` | Secret de 32+ chars para Better Auth |
| `BETTER_AUTH_URL` | URL base del frontend (`http://localhost:3000`) |

### `apps/api/.env.example`
| Variable | Propósito |
|---|---|
| `PORT` | Puerto del servidor (default: 3001) |
| `NODE_ENV` | Entorno (`development` / `production`) |
| `DATABASE_URL` | Conexión a Neon Postgres |
| `BETTER_AUTH_SECRET` | Secret de 32+ chars para Better Auth |
| `BETTER_AUTH_URL` | URL base de la API (`http://localhost:3001`) |
| `FRONTEND_URL` | URL del frontend (para CORS) |

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
5. **Después de cada merge a `main`**, sincronizar `develop`:
   ```bash
   git checkout develop
   git merge origin/main
   git push origin develop
   ```
   GitHub crea un commit de merge extra en `main` al cerrar un PR. Sin este paso,
   `develop` queda "1 behind main" y los historiales se desincronizarán con el tiempo.

Scopes de commit según app:
- `(web)` → cambios en `apps/web`
- `(api)` → cambios en `apps/api`
- `(root)` → cambios raíz (turbo, configs globales)
- `(packages)` → cambios en paquetes compartidos

**El agente nunca debe hacer push directo a `main`.**
**El agente siempre debe sincronizar `develop` con `origin/main` después de un PR mergeado.**

---

## Ver también

- `apps/web/CLAUDE.md` — Patrones específicos de Next.js
- `apps/api/CLAUDE.md` — Patrones específicos de Elysia (checklist para nuevo recurso)
- `docs/architecture.md` — Diagrama completo de capas
- `docs/conventions.md` — Convenciones de código, naming, manejo de errores
