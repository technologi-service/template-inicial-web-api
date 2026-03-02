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

### Ramas permanentes — las únicas que existen de forma continua

| Rama | Propósito | Regla |
|---|---|---|
| `main` | Producción. Solo código estable y probado | **Nunca** commitear ni pushear directo |
| `develop` | Integración. Base de todo el trabajo nuevo | **Nunca** commitear directo. Solo recibe merges de ramas de feature |

Las ramas de feature son **temporales**: se crean, se mergean, y se eliminan.

---

### Ciclo completo para cualquier cambio

```
develop (actualizado)
   │
   ├─► git checkout -b feat/nombre
   │         │
   │         │  commits...
   │         │
   │         ▼
   │    git push origin feat/nombre
   │    gh pr create --base develop
   │         │
   │         │  PR mergeado en GitHub
   │         ▼
   │    [rama feat/nombre eliminada en GitHub]
   │
   ▼
develop ◄── merge del PR (GitHub)
   │
   │  (cuando develop esté estable y probado)
   │
   ▼
gh pr create --base main   ← PR de develop → main
   │
   │  PR mergeado en GitHub
   ▼
main ◄── merge del PR
   │
   │  ⚠️ OBLIGATORIO: GitHub crea un merge commit en main
   │  que develop NO tiene. Sincronizar inmediatamente:
   ▼
git checkout develop
git pull origin develop
git merge origin/main --no-edit
git push origin develop
```

---

### Paso a paso — Inicio de cualquier tarea

```bash
# 1. Asegurarse de tener develop actualizado antes de crear la rama
git checkout develop
git pull origin develop

# 2. Crear la rama de feature desde develop
git checkout -b feat/nombre-descriptivo
# prefijos: feat/ fix/ chore/ docs/ refactor/

# 3. Hacer commits con Conventional Commits
git add apps/api/src/routes/post.route.ts
git commit -m "feat(api): add posts CRUD route"

# 4. Pushear la rama
git push origin feat/nombre-descriptivo

# 5. Abrir PR hacia develop (nunca hacia main directamente)
gh pr create --base develop --title "feat: add posts resource"
```

---

### Paso a paso — Después de mergear un PR a develop

```bash
# Actualizar local develop con el merge commit que GitHub creó
git checkout develop
git pull origin develop

# Eliminar la rama local de feature (ya fue mergeada)
git branch -d feat/nombre-descriptivo
```

---

### Paso a paso — Subir develop a main (release)

Solo cuando develop esté **estable y probado**:

```bash
# 1. Abrir PR de develop → main en GitHub
gh pr create --base main --head develop --title "release: <descripción>"

# 2. Mergear el PR en GitHub

# 3. INMEDIATAMENTE sincronizar develop con main
#    (GitHub crea un merge commit en main que develop no tiene)
git checkout develop
git pull origin develop
git merge origin/main --no-edit
git push origin develop

# 4. Verificar que develop y main estén al mismo nivel
git log --oneline --graph origin/main origin/develop -5
```

> **Por qué es obligatorio el paso 3:** Cuando GitHub cierra un PR,
> crea un commit de merge en `main` que `develop` no tiene. Sin este sync,
> `develop` quedará "1 commit behind main" indefinidamente y los historiales
> se desincronizarán con cada release.

---

### Diagnóstico: cómo verificar el estado de las ramas

```bash
# Ver estado visual de todas las ramas
git fetch --all
git log --oneline --graph origin/main origin/develop -10

# Ver cuántos commits de diferencia hay
git rev-list --left-right --count origin/main...origin/develop
# Salida: X Y  → X = commits solo en main, Y = commits solo en develop
# Ideal después de sync: 0 0
```

### Recuperación: si develop quedó "behind main"

```bash
git checkout develop
git pull origin develop
git merge origin/main --no-edit   # trae el merge commit que falta
git push origin develop
```

---

### Reglas absolutas del agente

- **NUNCA** hacer push directo a `main` o `develop`
- **NUNCA** usar `git push --force` a menos que el usuario lo pida explícitamente
- **SIEMPRE** crear la rama desde `develop` actualizado (`git pull origin develop` primero)
- **SIEMPRE** sincronizar `develop` con `main` después de un PR mergeado a `main`
- **SIEMPRE** abrir PRs con `--base develop` (feature → develop) o `--base main` (develop → main)
- **NUNCA** abrir un PR de feature directamente a `main`
- Eliminar ramas locales de feature después de mergear: `git branch -d feat/nombre`

---

### Naming de ramas y commits

| Tipo | Rama | Ejemplo commit |
|---|---|---|
| Nueva feature | `feat/nombre` | `feat(api): add posts route` |
| Bug fix | `fix/nombre` | `fix(web): correct auth redirect` |
| Tarea técnica | `chore/nombre` | `chore(root): update dependencies` |
| Documentación | `docs/nombre` | `docs(root): update architecture diagram` |
| Refactor | `refactor/nombre` | `refactor(api): extract auth middleware` |

Scopes de commit según app: `(web)`, `(api)`, `(root)`, `(packages)`

---

## Referencias Especializadas

| Documento | Contenido |
|---|---|
| `apps/api/CLAUDE.md` | Checklist completo para nuevo recurso Elysia, auth macros, DB, Swagger |
| `apps/web/CLAUDE.md` | Checklist para nueva página Next.js, componentes, auth client, apiServer/apiClient |
| `docs/architecture.md` | Diagrama completo de capas |
| `docs/conventions.md` | Naming, manejo de errores, convenciones |
