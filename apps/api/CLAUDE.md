# apps/api — Elysia REST API

> **Skill obligatorio:** Antes de crear o modificar un recurso en esta app,
> invocar el skill `elysiajs` para obtener patrones y contexto actualizado.

## Stack
- Runtime: Bun
- Framework: Elysia
- Language: TypeScript estricto
- Database: Drizzle ORM + Neon Postgres
- Auth: Better Auth (email + password)
- Puerto: `http://localhost:3001`
- Docs: `http://localhost:3001/docs`

---

## Arquitectura por Capas

```
src/
├── index.ts          # Entry point — instancia Elysia, middleware, grupos de rutas
├── lib/
│   └── auth.ts       # Instancia Better Auth (server config)
├── routes/           # Solo define rutas y conecta con controllers
├── controllers/      # Lógica de negocio pura
├── models/           # Tipos y esquemas Elysia (t.*)
├── middleware/
│   ├── auth.ts       # Better Auth plugin (handler + macro `auth`)
│   └── logger.ts     # Logger de requests
└── db/
    ├── index.ts      # Pool de Neon + instancia Drizzle con schema
    └── schema.ts     # Definiciones de tablas (agregar tablas aquí)
```

### Flujo de una request
```
Request → Middleware (logger, auth) → Route → Controller → Response
```

---

## Checklist: Agregar un Nuevo Recurso

> Seguir estos pasos **en orden**. Ejemplo con recurso `posts`.

### Paso 1 — Model (`src/models/post.ts`)

```ts
import { t } from "elysia";

export const postSchema = t.Object({
  id: t.Number(),
  title: t.String(),
  content: t.Nullable(t.String()),
});

export const createPostBody = t.Object({
  title: t.String(),
  content: t.Optional(t.String()),
});

export const postResponse = t.Object({
  data: postSchema,
  error: t.Nullable(t.String()),
});

export const postListResponse = t.Object({
  data: t.Array(postSchema),
  error: t.Nullable(t.String()),
});
```

### Paso 2 — Controller (`src/controllers/post.controller.ts`)

```ts
import { db } from "../db";
import { posts } from "../db/schema";

export const postController = {
  async getAll() {
    const data = await db.select().from(posts);
    return { data, error: null };
  },
  async getById(id: number) {
    const [data] = await db.select().from(posts).where(eq(posts.id, id));
    if (!data) return { data: null, error: "Not found" };
    return { data, error: null };
  },
  async create(body: { title: string; content?: string }) {
    const [data] = await db.insert(posts).values(body).returning();
    return { data, error: null };
  },
};
```

### Paso 3 — Route (`src/routes/post.route.ts`)

```ts
import { Elysia } from "elysia";
import { postController } from "../controllers/post.controller";
import { postListResponse, postResponse, createPostBody } from "../models/post";

export const postRoute = new Elysia({ prefix: "/posts" })
  .get("/", () => postController.getAll(), {
    response: postListResponse,
    detail: { tags: ["Posts"], summary: "List all posts" },
  })
  .get("/:id", ({ params }) => postController.getById(Number(params.id)), {
    response: postResponse,
    detail: { tags: ["Posts"], summary: "Get post by ID" },
  })
  .post("/", ({ body }) => postController.create(body), {
    body: createPostBody,
    response: postResponse,
    auth: true, // requiere autenticación
    detail: { tags: ["Posts"], summary: "Create a post" },
  });
```

### Paso 4 — Registrar en `src/index.ts`

```ts
// Importar la nueva ruta
import { postRoute } from "./routes/post.route";

// Agregar al grupo /api/v1
.group("/api/v1", (app) =>
  app
    .use(healthRoute)
    .use(postRoute)  // ← agregar aquí
)

// Agregar tag en swagger
tags: [
  { name: "Health", description: "Health check endpoints" },
  { name: "Posts", description: "Posts endpoints" },  // ← agregar aquí
],
```

### Paso 5 — Schema DB (si el recurso tiene tabla)

En `src/db/schema.ts`:
```ts
import { pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";

export const posts = pgTable("posts", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  content: text("content"),
  createdAt: timestamp("created_at").defaultNow(),
});
```

Luego migrar:
```bash
bun run db:generate
bun run db:migrate
```

---

## Autenticación (Better Auth)

### Archivos

| Archivo | Propósito |
|---|---|
| `src/lib/auth.ts` | Instancia Better Auth con Drizzle adapter y email/password |
| `src/middleware/auth.ts` | Plugin Elysia: monta handler `/api/auth/*` + macro `auth` |

### Proteger rutas con el macro `auth: true`

```ts
export const profileRoute = new Elysia({ prefix: "/profile" })
  .get("/me", ({ user }) => ({
    data: { id: user.id, name: user.name, email: user.email },
    error: null,
  }), {
    auth: true,
    detail: { tags: ["Profile"], summary: "Get current user" },
  });
```

Con `auth: true`, los handlers tienen acceso a `user` y `session` ya tipados en el contexto.

### Endpoints de auth (montados automáticamente)

- `POST /api/auth/sign-up/email` — Registro
- `POST /api/auth/sign-in/email` — Login
- `POST /api/auth/sign-out` — Cerrar sesión
- `GET /api/auth/get-session` — Sesión actual

---

## Base de Datos (Drizzle + Neon)

| Archivo | Propósito |
|---|---|
| `src/db/index.ts` | Pool de Neon + instancia Drizzle con schema |
| `src/db/schema.ts` | Definiciones de tablas (editar aquí) |
| `drizzle.config.ts` | Config de Drizzle Kit (migraciones en `src/db/migrations`) |

### Comandos

```bash
bun run db:generate   # Generar migración desde cambios en schema
bun run db:migrate    # Aplicar migraciones pendientes
bun run db:push       # Push directo (dev rápido, sin archivo de migración)
bun run db:studio     # Explorador visual de datos
```

### Tablas de Better Auth

```bash
cd apps/api && npx auth@latest generate  # Genera migración
cd apps/api && npx auth@latest migrate   # Aplica directamente
```

---

## Estructura de Respuesta HTTP

Todas las respuestas siguen el mismo formato — **sin excepción**:

```ts
// Éxito
{ data: T, error: null, meta?: { page: number, total: number } }

// Error
{ data: null, error: "Mensaje de error legible" }
```

### Códigos HTTP
- `200` — GET exitoso
- `201` — POST exitoso (recurso creado)
- `400` — Validación fallida (Elysia lo maneja automáticamente)
- `401` — No autenticado
- `403` — No autorizado
- `404` — Recurso no encontrado
- `500` — Error interno

---

## Comandos

```bash
bun run dev          # Watch mode en :3001
bun run build        # Compilar
bun run lint         # ESLint
bun run check-types  # TypeScript
```

---

## Variables de Entorno

Cargar con `Bun.env.VARIABLE_NAME`. Ver `.env.example`.

| Variable | Propósito |
|---|---|
| `PORT` | Puerto del servidor (default: 3001) |
| `NODE_ENV` | Entorno (`development` / `production`) |
| `DATABASE_URL` | Conexión a Neon Postgres |
| `BETTER_AUTH_SECRET` | Secret de 32+ chars para Better Auth |
| `BETTER_AUTH_URL` | URL base de la API (`http://localhost:3001`) |
| `FRONTEND_URL` | URL del frontend para CORS (`http://localhost:3000`) |

---

## Convenciones

- Prefijo base de todas las rutas: `/api/v1/`
- Nombres de rutas: kebab-case (`/user-profiles`)
- Nombres de archivos: kebab-case (`user.controller.ts`)
- Schemas siempre con `elysia/t` — nunca Zod u otra librería
- Middleware como plugins Elysia (`new Elysia({ name: "plugin-name" })`)
- Toda lógica de auth usa Better Auth — nunca JWT manual
- Tipo `App` exportado desde `src/index.ts` para Eden Treaty (cliente type-safe)
