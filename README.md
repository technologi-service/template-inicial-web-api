# Celta — Monorepo Template

Turborepo monorepo con **Next.js 16** (frontend) + **Elysia** (API REST), TypeScript estricto y Tailwind CSS v4.

---

## Apps & Packages

```
celta/
├── apps/
│   ├── web          — Frontend Next.js 16 (App Router, Tailwind CSS v4)
│   └── api          — Backend Elysia REST API (Bun)
└── packages/
    ├── typescript-config   — Configs TypeScript base (base, nextjs, elysia)
    └── eslint-config       — Reglas ESLint compartidas
```

| App / Package | Descripción | Puerto |
|---|---|---|
| `@celta/web` | Frontend Next.js 16 — App Router, Server Components, Tailwind v4 | `3000` |
| `@celta/api` | REST API Elysia — CORS, Swagger, logging middleware | `3001` |
| `@celta/typescript-config` | Configs TS compartidas | — |
| `@celta/eslint-config` | Reglas ESLint compartidas | — |

---

## Stack

- **Runtime:** [Bun](https://bun.sh) — package manager y runtime
- **Monorepo:** [Turborepo](https://turbo.build)
- **Frontend:** [Next.js 16](https://nextjs.org) — App Router, Server Components
- **Estilos:** [Tailwind CSS v4](https://tailwindcss.com)
- **Backend:** [Elysia](https://elysiajs.com) — framework TypeScript para Bun
- **Auth:** [Better Auth](https://better-auth.com) — email + password
- **Database:** [Neon Postgres](https://neon.tech) + [Drizzle ORM](https://orm.drizzle.team)
- **Documentación API:** Swagger en `http://localhost:3001/docs`
- **Lenguaje:** TypeScript estricto en todo el monorepo

---

## Primeros pasos

### Requisitos

- [Bun](https://bun.sh) `>= 1.2`

### Instalación

```bash
git clone https://github.com/technologi-service/template-inicial-web-api.git
cd template-inicial-web-api
bun install
```

### Desarrollo

```bash
# Ambas apps en paralelo (recomendado)
bun run dev

# Apps individuales
cd apps/web && bun run dev   # http://localhost:3000
cd apps/api && bun run dev   # http://localhost:3001
```

---

## Comandos

Todos los comandos se ejecutan desde la raíz del monorepo con Turborepo:

| Comando | Descripción |
|---|---|
| `bun run dev` | Inicia `web` y `api` en paralelo con hot-reload |
| `bun run build` | Build completo de todas las apps y paquetes |
| `bun run lint` | Lint de todo el monorepo |
| `bun run check-types` | Verificación de tipos TypeScript |
| `bun run clean` | Elimina artefactos de build (`.next`, `dist`) |

---

## Estructura de la API

Todas las rutas viven bajo `/api/v1/`.

```
apps/api/src/
├── index.ts          — Entry point, instancia de Elysia y exports
├── routes/           — Definición de rutas HTTP
├── controllers/      — Lógica de negocio
├── models/           — Tipos y esquemas de validación (Elysia t)
└── middleware/       — Auth, logging, etc.
```

Respuesta estándar de la API:

```ts
{ data: T, error: string | null, meta?: object }
```

Documentación interactiva disponible en `http://localhost:3001/docs` (Swagger).

---

## Estructura del Frontend

```
apps/web/
├── app/              — Rutas y páginas (App Router)
├── components/       — Componentes React reutilizables
└── lib/
    └── api.ts        — Clientes HTTP (apiServer / apiClient)
```

Dos clientes HTTP en `lib/api.ts`:

- **`apiServer()`** — Server Components y Route Handlers
- **`apiClient()`** — Client Components

Ambos auto-prefijan `/api/v1` a todos los paths.

---

## Variables de entorno

Copia los archivos de ejemplo antes de desarrollar:

```bash
cp apps/web/.env.example apps/web/.env.local
cp apps/api/.env.example apps/api/.env
```

| Variable | App | Descripción |
|---|---|---|
| `API_URL` | `web` | URL interna de la API (Server Components) |
| `NEXT_PUBLIC_API_URL` | `web` | URL pública de la API (Client Components) |
| `DATABASE_URL` | ambas | Conexión a Neon Postgres |
| `BETTER_AUTH_SECRET` | ambas | Secret de 32+ chars para Better Auth |
| `BETTER_AUTH_URL` | ambas | URL base de la app correspondiente |
| `FRONTEND_URL` | `api` | URL del frontend (para CORS) |
| `PORT` | `api` | Puerto del servidor (default: `3001`) |

---

## Flujo de Git

```
main       ← producción (nunca se toca directo)
develop    ← integración
  └── feat/nombre, fix/nombre, chore/nombre
```

Commits en [Conventional Commits](https://www.conventionalcommits.org/) con scope de app:

```
feat(web): añadir página de dashboard
fix(api): corregir validación en ruta de usuarios
chore(root): actualizar configuración de Turborepo
```

Scopes: `(web)` · `(api)` · `(root)` · `(packages)`
