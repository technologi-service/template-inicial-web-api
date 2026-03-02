# apps/api — Elysia REST API

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
├── middleware/        # Plugins globales
│   ├── auth.ts       # Better Auth plugin (handler + macro)
│   └── logger.ts     # Logger de requests
└── db/
    ├── index.ts      # Pool de Neon + instancia Drizzle
    └── schema.ts     # Definiciones de tablas
```

### Flujo de una request
```
Request → Middleware (logger, auth) → Route → Controller → Response
```

---

## Autenticación (Better Auth)

### Archivos

| Archivo | Propósito |
|---|---|
| `src/lib/auth.ts` | Instancia Better Auth con Drizzle adapter y email/password |
| `src/middleware/auth.ts` | Plugin Elysia: monta handler + macro `auth` |

### Proteger rutas

Usar el macro `auth: true` para requerir autenticación:

```ts
import { Elysia } from "elysia";

export const profileRoute = new Elysia({ prefix: "/profile" })
  .get("/me", ({ user }) => ({
    data: { id: user.id, name: user.name, email: user.email },
    error: null,
  }), {
    auth: true,
    detail: { tags: ["Profile"], summary: "Get current user" },
  });
```

Cuando `auth: true`, los handlers tienen acceso a `user` y `session` ya tipados.

### Endpoints de auth (automáticos)

Better Auth monta automáticamente estos endpoints en `/api/auth/*`:
- `POST /api/auth/sign-up/email` — Registro con email + password
- `POST /api/auth/sign-in/email` — Login con email + password
- `POST /api/auth/sign-out` — Cerrar sesión
- `GET /api/auth/get-session` — Obtener sesión actual

---

## Base de Datos (Drizzle + Neon)

### Archivos

| Archivo | Propósito |
|---|---|
| `src/db/index.ts` | Pool de Neon + instancia Drizzle con schema |
| `src/db/schema.ts` | Definiciones de tablas (agregar tablas aquí) |
| `drizzle.config.ts` | Config de Drizzle Kit (migraciones en `src/db/migrations`) |

### Comandos de base de datos

```bash
bun run db:generate   # Generar migración desde cambios en schema
bun run db:migrate    # Aplicar migraciones pendientes
bun run db:push       # Push directo al schema (dev rápido, sin migración)
bun run db:studio     # Explorador visual de datos
```

### Agregar una nueva tabla

1. Definir en `src/db/schema.ts`:
```ts
import { pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";

export const posts = pgTable("posts", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  content: text("content"),
  createdAt: timestamp("created_at").defaultNow(),
});
```

2. Generar y aplicar migración:
```bash
bun run db:generate
bun run db:migrate
```

### Tablas de Better Auth (automáticas)

Better Auth crea las tablas `user`, `session`, `account`, `verification` automáticamente. Generar estas tablas con:
```bash
cd apps/api && npx auth@latest generate  # Genera migración
cd apps/api && npx auth@latest migrate   # Aplica directamente
```

---

## Checklist: Agregar un Nuevo Recurso

Ejemplo: recurso `posts`

1. **Model** — `src/models/post.ts`
   ```ts
   import { t } from "elysia";
   export const postSchema = t.Object({ id: t.Number(), title: t.String(), content: t.Nullable(t.String()) });
   export const createPostBody = t.Object({ title: t.String(), content: t.Optional(t.String()) });
   export const postResponse = t.Object({ data: postSchema, error: t.Nullable(t.String()) });
   export const postListResponse = t.Object({ data: t.Array(postSchema), error: t.Nullable(t.String()) });
   ```

2. **Controller** — `src/controllers/post.controller.ts`
   ```ts
   export const postController = {
     getAll() { return { data: [], error: null }; },
     getById(id: number) { return { data: null, error: null }; },
     create(body: { title: string; content?: string }) { return { data: null, error: null }; },
   };
   ```

3. **Route** — `src/routes/post.route.ts`
   ```ts
   import { Elysia } from "elysia";
   import { postController } from "../controllers/post.controller";
   import { postListResponse, postResponse, createPostBody } from "../models/post";

   export const postRoute = new Elysia({ prefix: "/posts" })
     .get("/", () => postController.getAll(), {
       response: postListResponse,
       detail: { tags: ["Posts"], summary: "List all posts" },
     })
     .post("/", ({ body }) => postController.create(body), {
       body: createPostBody,
       response: postResponse,
       detail: { tags: ["Posts"], summary: "Create a post" },
       auth: true, // Requiere autenticación
     });
   ```

4. **Registrar en `src/index.ts`**
   ```ts
   .group("/api/v1", (app) => app.use(healthRoute).use(postRoute))
   ```

5. **Swagger tags** — Agregar el tag en la documentación de swagger en `index.ts`:
   ```ts
   tags: [
     { name: "Health", description: "Health check endpoints" },
     { name: "Posts", description: "Posts endpoints" },
   ],
   ```

---

## Estructura de Respuesta HTTP

Todas las respuestas siguen el mismo formato:

```ts
// Éxito
{ data: T, error: null, meta?: { page, total } }

// Error
{ data: null, error: "Mensaje de error" }
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
bun run dev        # Watch mode
bun run build      # Compilar
bun run lint       # ESLint
bun run check-types # TypeScript
```

---

## Variables de Entorno

Ver `.env.example`. Cargar con `Bun.env.VARIABLE_NAME`.

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

- Prefijo base: `/api/v1/`
- Nombres de rutas: kebab-case (`/user-profiles`)
- Nombres de archivos: kebab-case (`user.controller.ts`)
- Schemas siempre con `elysia/t`, nunca Zod u otra lib
- Middleware como plugins Elysia (`new Elysia({ name: "..." })`)
- Toda lógica de auth usa Better Auth (nunca JWT manual)
