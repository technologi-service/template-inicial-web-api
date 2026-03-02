# Arquitectura — Celta Monorepo

## Diagrama de Capas

```
┌─────────────────────────────────────────────┐
│              Browser / Client               │
└──────────────────┬──────────────────────────┘
                   │ HTTP
┌──────────────────▼──────────────────────────┐
│           apps/web (Next.js 16)             │
│  ┌─────────────┐  ┌──────────────────────┐  │
│  │  app/       │  │  components/         │  │
│  │  (routes)   │  │  (React components)  │  │
│  └──────┬──────┘  └──────────────────────┘  │
│         │ lib/api.ts (REST)                  │
│         │ lib/auth/ (Better Auth Client)     │
│  ┌──────┴───────────────────────────────┐   │
│  │  middleware.ts (auth cookie check)   │   │
│  └──────────────────────────────────────┘   │
└─────────┼───────────────────────────────────┘
          │ HTTP (fetch)
┌─────────▼───────────────────────────────────┐
│           apps/api (Elysia)                 │
│  ┌──────────────────────────────────────┐   │
│  │  middleware/ (cors, logger, auth)    │   │
│  │  Better Auth plugin + macro          │   │
│  └────────────────┬─────────────────────┘   │
│  ┌────────────────▼─────────────────────┐   │
│  │  routes/ (HTTP routing)              │   │
│  └────────────────┬─────────────────────┘   │
│  ┌────────────────▼─────────────────────┐   │
│  │  controllers/ (business logic)       │   │
│  └────────────────┬─────────────────────┘   │
│  ┌────────────────▼─────────────────────┐   │
│  │  models/ (types, schemas)            │   │
│  └──────────────────────────────────────┘   │
│  ┌──────────────────────────────────────┐   │
│  │  lib/auth.ts (Better Auth instance)  │   │
│  └──────────────────────────────────────┘   │
└─────────┬───────────────────────────────────┘
          │ Drizzle ORM
┌─────────▼───────────────────────────────────┐
│         Neon Postgres (Serverless)           │
│  Tablas de app + tablas de Better Auth       │
│  (user, session, account, verification)      │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│              packages/                      │
│  typescript-config  │  eslint-config        │
│  (base, nextjs, elysia)                     │
└─────────────────────────────────────────────┘
```

---

## Responsabilidad de Cada Directorio

### `apps/web/app/`
- **Qué hace:** Define las rutas de la aplicación web
- **Archivos:** `page.tsx`, `layout.tsx`, `loading.tsx`, `error.tsx`
- **Regla:** Sin lógica de negocio. Llama a la API vía `lib/api.ts`

### `apps/web/components/`
- **Qué hace:** Componentes React reutilizables
- **Subcarpetas:** `ui/` (genéricos), `[feature]/` (específicos de feature)
- **Regla:** Sin llamadas directas a la API. Reciben datos como props

### `apps/web/lib/api.ts`
- **Qué hace:** Cliente HTTP tipado para consumir la API REST
- **Exports:** `apiServer()`, `apiClient()`, `ApiError`
- **Regla:** Único punto de salida hacia la API REST. No duplicar fetch calls

### `apps/web/lib/auth/`
- **Qué hace:** Cliente de Better Auth configurado para apuntar a Elysia
- **Archivos:** `client.ts` (cliente React base), `server-fetch.ts` (helper SSR)
- **Regla:** Next.js NUNCA guarda la clave de la base de datos ni expone API de auth, delega totalmente a Elysia.

### `apps/web/middleware.ts`
- **Qué hace:** Protección de rutas con cookie check
- **Regla:** Solo verificar cookie de sesión, sin llamadas a DB

### `apps/api/src/lib/auth.ts`
- **Qué hace:** Instancia Better Auth con Drizzle adapter
- **Regla:** Única fuente de verdad para la config de auth en el backend

### `apps/api/src/routes/`
- **Qué hace:** Mapa de endpoints HTTP a handlers
- **Regla:** Sin lógica. Sólo conectar URL + método → controller

### `apps/api/src/controllers/`
- **Qué hace:** Lógica de negocio, orquestación
- **Regla:** Sin dependencias de HTTP (no accede a `request`). Funciones puras

### `apps/api/src/models/`
- **Qué hace:** Esquemas de validación (Elysia `t.*`) y tipos TypeScript
- **Regla:** Sólo definiciones. Sin lógica ejecutable

### `apps/api/src/middleware/`
- **Qué hace:** Plugins globales de Elysia (cors, logger, auth)
- **Regla:** Siempre como plugins Elysia (`new Elysia({ name: "..." })`)

### `apps/api/src/db/`
- **Qué hace:** Conexión a Neon Postgres y definiciones de tablas
- **Archivos:** `index.ts` (pool + drizzle instance), `schema.ts` (tablas)
- **Regla:** Las tablas van en `schema.ts`. La conexión no se duplica

### `packages/typescript-config/`
- **Qué hace:** Configs TypeScript base compartidas
- **Cuándo actualizar:** Al cambiar versión de TypeScript o necesitar nueva config

### `packages/eslint-config/`
- **Qué hace:** Reglas ESLint compartidas
- **Cuándo actualizar:** Al agregar nuevas reglas o plugins globales

---

## Flujo de Datos

```
1. Usuario interactúa con UI (apps/web)
2. Server Component hace fetch server-side via apiServer()
   — O —
   Client Component hace fetch client-side via apiClient()
3. apps/api recibe request → middleware → route → controller
4. Controller accede a DB via Drizzle y devuelve { data, error, meta? }
5. apps/web renderiza el resultado
```

### Flujo de Autenticación

```
1. Usuario llena formulario de sign-in/sign-up
2. authClient.signIn.email() → POST /api/auth/sign-in/email (Elysia :3001)
3. Elysia valida credenciales contra DB y setea cookie
4. middleware.ts en Next.js verifica si la cookie existe para proteger vistas
5. Next.js Server Components pueden hacer fetch a Elysia para obtener la sesión segura
6. En la API (Elysia): macro `auth: true` protege tu lógica de negocio
```

---

## URLs por Entorno

| Entorno | Web | API |
|---|---|---|
| Development | `http://localhost:3000` | `http://localhost:3001` |
| Production | `https://celta.app` | `https://api.celta.app` |

---

## Cuándo Actualizar Este Archivo

- Al agregar una nueva capa arquitectural
- Al cambiar la estructura de directorios
- Al cambiar puertos o URLs base
- Al agregar una nueva app o package al monorepo
- Al cambiar el sistema de autenticación
- Al agregar una nueva integración (cache, queue, etc.)
