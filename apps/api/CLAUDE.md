# apps/api — Elysia REST API

## Stack
- Runtime: Bun
- Framework: Elysia
- Language: TypeScript estricto
- Puerto: `http://localhost:3001`
- Docs: `http://localhost:3001/docs`

---

## Arquitectura por Capas

```
src/
├── index.ts          # Entry point — instancia Elysia, middleware, grupos de rutas
├── routes/           # Solo define rutas y conecta con controllers
├── controllers/      # Lógica de negocio pura
├── models/           # Tipos y esquemas Elysia (t.*)
└── middleware/       # Plugins globales (auth, logger, etc.)
```

### Flujo de una request
```
Request → Middleware → Route → Controller → Response
```

---

## Checklist: Agregar un Nuevo Recurso

Ejemplo: recurso `users`

1. **Model** — `src/models/user.ts`
   ```ts
   import { t } from "elysia";
   export const userSchema = t.Object({ id: t.String(), name: t.String() });
   export const createUserBody = t.Object({ name: t.String() });
   ```

2. **Controller** — `src/controllers/user.controller.ts`
   ```ts
   export const userController = {
     getAll() { return { data: [], error: null }; },
     getById(id: string) { return { data: null, error: null }; },
     create(body: CreateUserBody) { return { data: null, error: null }; },
   };
   ```

3. **Route** — `src/routes/user.route.ts`
   ```ts
   import { Elysia } from "elysia";
   import { userController } from "../controllers/user.controller";
   export const userRoute = new Elysia({ prefix: "/users" })
     .get("/", () => userController.getAll())
     .post("/", ({ body }) => userController.create(body));
   ```

4. **Registrar en index.ts**
   ```ts
   .group("/api/v1", (app) => app.use(healthRoute).use(userRoute))
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

---

## Convenciones

- Prefijo base: `/api/v1/`
- Nombres de rutas: kebab-case (`/user-profiles`)
- Nombres de archivos: kebab-case (`user.controller.ts`)
- Schemas siempre con `elysia/t`, nunca Zod u otra lib
- Middleware como plugins Elysia (`new Elysia({ name: "..." })`)
