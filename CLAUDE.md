# CLAUDE.md — Orquestador del Monorepo

Este archivo guía al agente en todo cambio o implementación dentro del monorepo.
Antes de escribir cualquier código, seguir el protocolo de decisión abajo.

---

## Protocolo del Agente — Qué hacer ante cada tarea

### 1. Identificar el alcance del cambio

| Tipo de tarea | Acción |
|---|---|
| Solo afecta la API (nueva ruta, controller, DB) | Leer `apps/api/CLAUDE.md` → usar skill `elysiajs` |
| Solo afecta el frontend (nueva página, componente, UI) | Leer `apps/web/CLAUDE.md` → seguir patrones Next.js App Router |
| Afecta ambas capas | **Implementar API primero**, luego frontend |
| Solo configuración / paquetes compartidos | Editar en `packages/` o raíz, no crear archivos nuevos |

### 2. Flujo obligatorio para nueva implementación full-stack

```
1. Leer apps/api/CLAUDE.md  →  crear model + controller + route (Elysia)
2. Registrar ruta en apps/api/src/index.ts
3. Si hay DB: definir schema → bun run db:generate → bun run db:migrate
4. Leer apps/web/CLAUDE.md  →  crear página + actualizar lib/api.ts si hay endpoint nuevo
5. Verificar tipos con bun run check-types (desde raíz)
6. Seguir flujo de Git (ver sección abajo)
```

### 3. Skills disponibles

| Skill | Cuándo usarlo |
|---|---|
| `elysiajs` | Siempre que se cree o modifique un recurso en `apps/api/` |
| `neon-drizzle` | Al agregar nuevas tablas o cambiar schemas en Drizzle |
| `neon-postgres` | Al necesitar orientación sobre Neon o conexión a la DB |

**Invocar el skill antes de escribir código.** Los skills proveen contexto y patrones actualizados.

### 4. Regla de sub-CLAUDE.md

- **`apps/api/CLAUDE.md`** — fuente de verdad para todo lo de Elysia: routes, controllers, models, auth macros, DB, Swagger
- **`apps/web/CLAUDE.md`** — fuente de verdad para todo lo de Next.js: páginas, componentes, auth client, apiServer/apiClient

Siempre leer el sub-CLAUDE.md correspondiente antes de hacer cambios en esa app.

---

## Arquitectura General

Monorepo con Turborepo + Bun. Dos aplicaciones principales:
- `apps/web` — Frontend Next.js 16 (App Router, TypeScript, Tailwind CSS v4)
- `apps/api` — Backend Elysia REST API (Bun, TypeScript)

Paquetes compartidos:
- `packages/typescript-config` — Configs de TypeScript base (base, nextjs, elysia)
- `packages/eslint-config` — Reglas ESLint compartidas

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

## Mapa de Responsabilidades

| Responsabilidad | Ubicación |
|---|---|
| Páginas y rutas UI | `apps/web/app/` |
| Componentes React | `apps/web/components/` |
| Llamadas a la API | `apps/web/lib/api.ts` |
| Auth client (Better Auth) | `apps/web/lib/auth/client.ts` |
| Auth server helper | `apps/web/lib/auth/server-fetch.ts` |
| Auth middleware Next.js | `apps/web/middleware.ts` |
| Rutas HTTP | `apps/api/src/routes/` |
| Lógica de negocio | `apps/api/src/controllers/` |
| Tipos y esquemas Elysia | `apps/api/src/models/` |
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

El proyecto usa **Better Auth** con email + password. La autenticación se maneja en dos capas:

### Backend (`apps/api`):
- **`src/lib/auth.ts`** — Instancia Better Auth con Drizzle adapter + email/password
- **`src/middleware/auth.ts`** — Plugin Elysia que monta el handler y provee macro `auth`

### Frontend (`apps/web`):
- **`lib/auth/server-fetch.ts`** — Helper para leer sesión en Server Components delegando a Elysia
- **`lib/auth/client.ts`** — Cliente React (`createAuthClient`) apuntando a la API en `:3001`
- **`middleware.ts`** — Protege `/account/*` verificando la cookie de sesión

### Proteger rutas en la API:
```ts
app.get("/perfil", ({ user }) => ({ data: user, error: null }), {
  auth: true, // macro del plugin auth
});
```

### Obtener sesión en Server Components (Next.js):
```tsx
import { getSession } from "@/lib/auth/server-fetch";
const data = await getSession();
if (!data?.session) redirect("/auth/sign-in");
```

### Auth en Client Components:
```tsx
import { authClient } from "@/lib/auth/client";
const { data: session } = authClient.useSession();
await authClient.signIn.email({ email, password, callbackURL: "/account" });
await authClient.signOut({ fetchOptions: { onSuccess: () => router.push("/") } });
```

---

## Base de Datos (Drizzle + Neon)

- **Conexión:** `apps/api/src/db/index.ts` — Pool de Neon Postgres con Drizzle ORM
- **Esquemas:** `apps/api/src/db/schema.ts` — Definiciones de tablas
- **Config:** `apps/api/drizzle.config.ts` — Migraciones en `./src/db/migrations`
- **Driver:** `@neondatabase/serverless` con `drizzle-orm/neon-serverless`

Better Auth crea automáticamente sus tablas (`user`, `session`, `account`, `verification`).

---

## Reglas de Código

- TypeScript estricto en todo el proyecto — sin `any` explícito
- Preferir `type` sobre `interface` para objetos de datos
- Imports con alias `@/` en Next.js; paths relativos en la API
- Respuestas API siempre con estructura `{ data: T, error: string | null, meta? }`
- Variables de entorno desde `.env` únicamente; en Bun usar `Bun.env.VAR`
- Commits en formato Conventional Commits con scope: `feat(web):`, `fix(api):`, `chore(root):`

---

## Reglas: Cuándo Crear vs Editar

**Editar siempre que sea posible.** Crear archivo nuevo sólo cuando:
- Es una nueva página/ruta en Next.js (`app/nueva-ruta/page.tsx`)
- Es un nuevo recurso en la API (requiere route + controller + model)
- Es un nuevo componente reutilizable genuinamente compartido

**Nunca crear:**
- Helpers one-off — usar funciones inline
- Archivos de configuración adicionales sin justificación clara
- Duplicados de lógica existente

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
| `DATABASE_URL` | Conexión a Neon Postgres |
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
2. Hacer commits con scope correcto
3. Mergear a `develop` y subir: `git push origin develop`
4. Para producción: `develop` → `main` (solo cuando esté estable)
5. **Después de cada merge a `main`**, sincronizar `develop`:
   ```bash
   git checkout develop && git merge origin/main && git push origin develop
   ```

**El agente nunca debe hacer push directo a `main`.**
**El agente siempre debe sincronizar `develop` con `origin/main` después de un PR mergeado.**

---

## Referencias Especializadas

| Documento | Contenido |
|---|---|
| `apps/api/CLAUDE.md` | Checklist completo para nuevo recurso Elysia, auth macros, DB, Swagger |
| `apps/web/CLAUDE.md` | Checklist para nueva página Next.js, componentes, auth client, apiServer/apiClient |
| `docs/architecture.md` | Diagrama completo de capas |
| `docs/conventions.md` | Naming, manejo de errores, convenciones |
