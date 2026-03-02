# Arquitectura — Celta Monorepo

## Diagrama de Capas

```
┌─────────────────────────────────────────────┐
│              Browser / Client               │
└──────────────────┬──────────────────────────┘
                   │ HTTP
┌──────────────────▼──────────────────────────┐
│           apps/web (Next.js 15)             │
│  ┌─────────────┐  ┌──────────────────────┐  │
│  │  app/       │  │  components/         │  │
│  │  (routes)   │  │  (React components)  │  │
│  └──────┬──────┘  └──────────────────────┘  │
│         │ lib/api.ts                         │
└─────────┼───────────────────────────────────┘
          │ HTTP (fetch)
┌─────────▼───────────────────────────────────┐
│           apps/api (Elysia)                 │
│  ┌──────────────────────────────────────┐   │
│  │  middleware/ (cors, logger, auth)    │   │
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
└─────────┬───────────────────────────────────┘
          │ (futuro: DB driver)
┌─────────▼───────────────────────────────────┐
│              Database (futuro)              │
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
- **Qué hace:** Cliente HTTP tipado para consumir la API
- **Exports:** `apiServer()`, `apiClient()`, `ApiError`
- **Regla:** Único punto de salida hacia la API. No duplicar fetch calls

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
4. Controller devuelve { data, error, meta? }
5. apps/web renderiza el resultado
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
