# Convenciones de Código — Celta

## Naming

### Archivos
| Tipo | Convención | Ejemplo |
|---|---|---|
| Componentes React | PascalCase | `UserCard.tsx` |
| Routes Next.js | kebab-case (carpeta) | `user-profile/page.tsx` |
| Controllers | kebab-case con sufijo | `user.controller.ts` |
| Routes API | kebab-case con sufijo | `user.route.ts` |
| Models/Schemas | kebab-case con sufijo | `user.model.ts` o `user.ts` |
| Middleware | kebab-case con sufijo | `auth.middleware.ts` o `auth.ts` |
| Utilities | kebab-case | `format-date.ts` |

### Variables y Funciones
```ts
// Variables: camelCase
const userName = "john";

// Funciones: camelCase, verbo + sustantivo
function getUserById(id: string) {}
function createPost(body: CreatePostBody) {}

// Constantes: SCREAMING_SNAKE_CASE
const MAX_RETRIES = 3;
const API_VERSION = "v1";

// Types e Interfaces: PascalCase
type UserResponse = { id: string; name: string };
interface CreateUserBody { name: string; email: string }

// Enums: PascalCase con valores SCREAMING_SNAKE_CASE
enum UserRole { ADMIN = "ADMIN", USER = "USER" }
```

### Componentes React
```tsx
// PascalCase, exportación nombrada preferida
export function UserCard({ user }: UserCardProps) {}

// Props siempre tipadas, mismo archivo
type UserCardProps = {
  user: User;
  onSelect?: (id: string) => void;
};
```

---

## Estructura de Archivos Nuevos

### Nuevo Componente React
```tsx
// components/ui/Button.tsx
type ButtonProps = {
  label: string;
  onClick?: () => void;
  variant?: "primary" | "secondary";
};

export function Button({ label, onClick, variant = "primary" }: ButtonProps) {
  return (
    <button
      onClick={onClick}
      className={variant === "primary" ? "bg-blue-600" : "bg-gray-200"}
    >
      {label}
    </button>
  );
}
```

### Nueva Página Next.js
```tsx
// app/nueva-ruta/page.tsx
import { apiServer } from "@/lib/api";

// Siempre async para Server Components que necesiten datos
export default async function NuevaRutaPage() {
  const { data } = await apiServer().get<MyType>("/endpoint");
  return <div>{/* UI */}</div>;
}

// Metadata opcional
export const metadata = {
  title: "Nueva Ruta — Celta",
};
```

### Nuevo Recurso API (checklist completo)
Ver `apps/api/CLAUDE.md` para el checklist paso a paso.

---

## Manejo de Errores

### En la API (Elysia)
```ts
// Controller — retornar error estructurado
export const userController = {
  async getById(id: string) {
    const user = await db.user.findById(id);
    if (!user) {
      // Elysia maneja el status code en la route
      return { data: null, error: "User not found" };
    }
    return { data: user, error: null };
  },
};

// Route — mapear a código HTTP
userRoute.get("/:id", async ({ params, set }) => {
  const result = await userController.getById(params.id);
  if (result.error) {
    set.status = 404;
  }
  return result;
});
```

### En el Frontend (Next.js)
```tsx
// Server Component
async function Page({ params }: { params: { id: string } }) {
  try {
    const { data } = await apiServer().get<User>(`/users/${params.id}`);
    return <UserView user={data} />;
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      notFound(); // Activa not-found.tsx
    }
    throw error; // Activa error.tsx
  }
}
```

---

## TypeScript

- **Nunca usar `any`** — usar `unknown` + type guards si es necesario
- **Preferir `type` sobre `interface`** para objetos de datos
- **Usar `interface` sólo** para contratos que se extienden
- **Type imports** para evitar importar valores en tiempo de ejecución:
  ```ts
  import type { User } from "@/types/user";
  ```

---

## Imports

Orden de imports (de más general a más específico):
```ts
// 1. Node.js built-ins
import { readFile } from "fs/promises";

// 2. Third-party
import { Elysia } from "elysia";
import type { NextConfig } from "next";

// 3. Monorepo packages
import { something } from "@celta/shared";

// 4. App internals (con alias @/)
import { apiServer } from "@/lib/api";
import type { User } from "@/types/user";
```

---

## Commits

Formato Conventional Commits:
```
feat: agregar autenticación JWT
fix: corregir validación de email en registro
chore: actualizar dependencias
refactor: extraer lógica de paginación
docs: actualizar arquitectura.md con nueva capa de cache
```

Scopes opcionales:
```
feat(api): agregar endpoint de búsqueda
fix(web): corregir layout en mobile
```

---

## Variables de Entorno

- **Nunca hardcodear** valores sensibles
- **Nunca commitear** archivos `.env` (sólo `.env.example`)
- En Next.js: `NEXT_PUBLIC_` sólo para valores seguros de exponer al browser
- En Elysia/Bun: usar `Bun.env.VARIABLE_NAME` (tipado automático)
