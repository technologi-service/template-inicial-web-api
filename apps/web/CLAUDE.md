# apps/web — Next.js 16 Frontend

> **Antes de crear una nueva página o feature:** leer este archivo completo
> y seguir el checklist correspondiente al tipo de cambio.

## Stack
- Framework: Next.js 16 (App Router)
- Language: TypeScript estricto
- Estilos: Tailwind CSS v4
- Auth: Better Auth (email + password) — cliente apuntando a la API en `:3001`
- Puerto: `http://localhost:3000`

---

## Estructura de Directorios

```
apps/web/
├── app/                    # Rutas (App Router)
│   ├── layout.tsx          # Root layout
│   ├── page.tsx            # Homepage (/)
│   ├── auth/               # Páginas de autenticación
│   │   ├── sign-in/page.tsx
│   │   └── sign-up/page.tsx
│   ├── account/page.tsx    # Página protegida (requiere auth)
│   └── api/                # Route handlers (solo si es necesario)
├── components/             # Componentes reutilizables
│   ├── ui/                 # Componentes genéricos (Button, Input, etc.)
│   └── [feature]/          # Componentes de una feature específica
├── lib/
│   ├── api.ts              # Cliente HTTP para la API REST
│   └── auth/
│       ├── server-fetch.ts # Helper para Server Components (llama a Elysia)
│       └── client.ts       # Cliente Better Auth apuntando a :3001
├── middleware.ts           # Protección de rutas (/account/*)
└── app/globals.css         # Estilos globales + Tailwind
```

---

## Checklist: Agregar una Nueva Página

> Seguir en orden. Ejemplo: página de listado de posts `/posts`.

### Paso 1 — Decidir: ¿Server o Client Component?

**Usar Server Component (por defecto)** cuando:
- La página solo lee datos de la API
- No necesita interactividad del usuario
- Puede usar `async/await` directamente

**Usar Client Component** (`"use client"`) solo cuando:
- Necesita `useState`, `useEffect`, `useReducer`
- Tiene event handlers (`onClick`, `onChange`, etc.)
- Usa APIs del browser (`localStorage`, `window`)
- Usa hooks de Better Auth (`authClient.useSession()`)

### Paso 2 — Crear la página (`app/posts/page.tsx`)

**Server Component con datos de la API:**
```tsx
import { apiServer } from "@/lib/api";

type Post = { id: number; title: string; content: string | null };

export default async function PostsPage() {
  const { data: posts } = await apiServer().get<Post[]>("/posts");
  return (
    <main>
      <h1>Posts</h1>
      <ul>
        {posts?.map((post) => (
          <li key={post.id}>{post.title}</li>
        ))}
      </ul>
    </main>
  );
}
```

**Página protegida (requiere sesión):**
```tsx
import { getSession } from "@/lib/auth/server-fetch";
import { redirect } from "next/navigation";

export default async function ProtectedPage() {
  const data = await getSession();
  if (!data?.session) redirect("/auth/sign-in");
  return <div>Hola {data.user.name}</div>;
}
```

### Paso 3 — Si el endpoint es nuevo, actualizar `lib/api.ts`

Verificar si `apiServer()` y `apiClient()` ya tienen el path necesario.
Ambas funciones auto-prefijan `/api/v1` — solo pasar el path relativo:
```ts
apiServer().get<Post[]>("/posts")     // llama a /api/v1/posts
apiClient().post<Post>("/posts", body) // llama a /api/v1/posts
```

### Paso 4 — Componentes reutilizables

Si la UI es reutilizable en más de un lugar, crear en `components/[feature]/`:
```
components/
└── posts/
    ├── post-card.tsx
    └── post-list.tsx
```

Si es genérico (botón, input, modal), va en `components/ui/`.

---

## Autenticación (Better Auth)

### Archivos

| Archivo | Propósito |
|---|---|
| `lib/auth/server-fetch.ts` | Fetch helper que delega a Elysia para leer sesión en Server Components |
| `lib/auth/client.ts` | Cliente React (`createAuthClient`) con `baseURL` apuntando a `:3001` |
| `middleware.ts` | Protege `/account/*` verificando la cookie de sesión |
| `app/auth/sign-in/page.tsx` | Formulario de login |
| `app/auth/sign-up/page.tsx` | Formulario de registro |
| `app/account/page.tsx` | Página protegida de ejemplo |

### Auth en Client Components

```tsx
"use client";
import { authClient } from "@/lib/auth/client";
import { useRouter } from "next/navigation";

export function AuthButtons() {
  const router = useRouter();
  const { data: session, isPending } = authClient.useSession();

  const handleSignIn = async () => {
    await authClient.signIn.email({
      email: "user@example.com",
      password: "password",
      callbackURL: "/account",
    });
  };

  const handleSignOut = async () => {
    await authClient.signOut({
      fetchOptions: { onSuccess: () => router.push("/") },
    });
  };

  if (isPending) return <span>Cargando...</span>;
  return session ? (
    <button onClick={handleSignOut}>Cerrar sesión</button>
  ) : (
    <button onClick={handleSignIn}>Iniciar sesión</button>
  );
}
```

### Auth en Server Components

```tsx
import { getSession } from "@/lib/auth/server-fetch";
import { redirect } from "next/navigation";

export default async function AccountPage() {
  const data = await getSession();
  if (!data?.session) redirect("/auth/sign-in");
  return <h1>Bienvenido, {data.user.name}</h1>;
}
```

---

## Llamadas a la API REST

### Desde Server Components

```tsx
import { apiServer } from "@/lib/api";

export default async function Page() {
  try {
    const { data } = await apiServer().get<MyType>("/recurso");
    return <div>{data?.name}</div>;
  } catch (error) {
    // manejar error
    throw error;
  }
}
```

### Desde Client Components

```tsx
"use client";
import { apiClient } from "@/lib/api";
import { useState } from "react";

export function CreateForm() {
  const handleSubmit = async (formData: FormData) => {
    const { data } = await apiClient().post<MyType>("/recurso", {
      name: formData.get("name") as string,
    });
    console.log(data);
  };
  return <form action={handleSubmit}>...</form>;
}
```

### Manejo de errores

```tsx
import { notFound } from "next/navigation";

try {
  const { data } = await apiServer().get<MyType>("/recurso/123");
} catch (error) {
  if (error instanceof ApiError && error.status === 404) {
    notFound(); // muestra app/not-found.tsx
  }
  throw error; // otros errores: muestra app/error.tsx
}
```

---

## Convención de Rutas (App Router)

| Archivo | Propósito |
|---|---|
| `app/ruta/page.tsx` | Página principal de la ruta |
| `app/ruta/layout.tsx` | Layout que wrappea rutas hijas |
| `app/ruta/loading.tsx` | UI de carga (Suspense boundary) |
| `app/ruta/error.tsx` | UI de error de la ruta |
| `app/ruta/not-found.tsx` | 404 de la ruta |

Convención de carpetas:
- `app/usuarios/` → ruta `/usuarios`
- `app/usuarios/[id]/` → ruta `/usuarios/:id`
- `app/(grupo)/login/` → ruta `/login` (grupo sin segmento de URL)

---

## Alias de Imports

Siempre usar `@/` para imports internos:
```ts
import { Button } from "@/components/ui/button";
import { apiServer } from "@/lib/api";
import { apiClient } from "@/lib/api";
import { authClient } from "@/lib/auth/client";
import { getSession } from "@/lib/auth/server-fetch";
```

---

## Comandos

```bash
bun run dev          # Desarrollo en :3000
bun run build        # Build de producción
bun run lint         # ESLint
bun run check-types  # TypeScript
```

---

## Variables de Entorno

Ver `.env.example`. Prefijo `NEXT_PUBLIC_` solo para variables accesibles desde el browser.

| Variable | Propósito |
|---|---|
| `API_URL` | URL interna de la API (sólo Server Components) |
| `NEXT_PUBLIC_API_URL` | URL pública de la API (accesible desde el browser) |
| `DATABASE_URL` | Conexión a Neon Postgres (para Better Auth server-side) |
| `BETTER_AUTH_SECRET` | Secret de 32+ chars para encriptación de sesiones |
| `BETTER_AUTH_URL` | URL base del frontend (`http://localhost:3000`) |
