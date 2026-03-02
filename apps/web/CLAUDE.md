# apps/web — Next.js 16 Frontend

## Stack
- Framework: Next.js 16 (App Router)
- Language: TypeScript estricto
- Estilos: Tailwind CSS v4
- Auth: Better Auth (email + password)
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
│   └── api/
│       └── (vacío)
├── components/             # Componentes reutilizables
│   ├── ui/                 # Componentes genéricos (Button, Input, etc.)
│   └── [feature]/          # Componentes de una feature específica
├── lib/
│   ├── api.ts              # Cliente HTTP para la API REST
│   └── auth/
│       ├── server-fetch.ts # Helper para Server Components que llama a Elysia
│       └── client.ts       # Cliente Better Auth apuntando a Elysia
├── middleware.ts           # Protección de rutas (/account/*)
└── app/globals.css         # Estilos globales + Tailwind
```

---

## Autenticación (Better Auth)

### Archivos de Auth

| Archivo | Propósito |
|---|---|
| `lib/auth/server-fetch.ts` | Fetch helper para leer la sesión en Server Components delegando a Elysia |
| `lib/auth/client.ts` | Cliente React configurado para apuntar a la API (`baseURL: :3001`) |
| `middleware.ts` | Protege `/account/*` verificando la cookie de sesión |
| `app/auth/sign-in/page.tsx` | Formulario de login (email + password) |
| `app/auth/sign-up/page.tsx` | Formulario de registro (nombre + email + password) |
| `app/account/page.tsx` | Página protegida que muestra datos del usuario |

### Usar auth en Client Components

```tsx
"use client";
import { authClient } from "@/lib/auth/client";

// Hook reactivo para obtener sesión
const { data: session, isPending } = authClient.useSession();

// Sign in con email y password
await authClient.signIn.email({ email, password, callbackURL: "/account" });

// Sign up
await authClient.signUp.email({ name, email, password, callbackURL: "/account" });

// Sign out
await authClient.signOut({
  fetchOptions: { onSuccess: () => router.push("/") },
});
```

### Obtener sesión en Server Components

```tsx
import { getSession } from "@/lib/auth/server-fetch";
import { redirect } from "next/navigation";

export default async function ProtectedPage() {
  const data = await getSession();
  if (!data?.session) { redirect("/auth/sign-in"); }
  return <div>Hola {data.user.name}</div>;
}
```

---

## Server Components vs Client Components

**Por defecto: Server Components** (sin `"use client"`).

Usar `"use client"` SÓLO cuando el componente necesite:
- `useState`, `useEffect`, `useReducer`
- Event handlers (`onClick`, `onChange`, etc.)
- APIs del browser (`localStorage`, `window`, etc.)
- Third-party libraries que requieren el browser
- Hooks de Better Auth (`authClient.useSession()`)

```tsx
// Server Component (default) — puede hacer async/await directo
export default async function Page() {
  const data = await apiServer().get<MyType>("/endpoint");
  return <div>{data.data.name}</div>;
}

// Client Component — sólo cuando sea necesario
"use client";
export function InteractiveButton() {
  const [count, setCount] = useState(0);
  return <button onClick={() => setCount(c => c + 1)}>{count}</button>;
}
```

---

## Convención de Rutas (App Router)

| Archivo | Propósito |
|---|---|
| `app/page.tsx` | Página principal de la ruta |
| `app/layout.tsx` | Layout que wrappea rutas hijas |
| `app/loading.tsx` | UI de carga (Suspense boundary) |
| `app/error.tsx` | UI de error de la ruta |
| `app/not-found.tsx` | 404 de la ruta |

Convención de carpetas:
- `app/usuarios/` → ruta `/usuarios`
- `app/usuarios/[id]/` → ruta `/usuarios/:id`
- `app/(auth)/login/` → ruta `/login` (grupo sin segmento de URL)

---

## Llamadas a la API REST

**Desde Server Components:**
```tsx
import { apiServer } from "@/lib/api";

// En un Server Component async
const result = await apiServer().get<MyType>("/recurso");
```

**Desde Client Components:**
```tsx
import { apiClient } from "@/lib/api";

// Dentro de un useEffect o event handler
const result = await apiClient().post<MyType>("/recurso", { name: "test" });
```

Manejar errores con `try/catch`:
```tsx
try {
  const { data } = await apiServer().get<MyType>("/recurso");
} catch (error) {
  if (error instanceof ApiError && error.status === 404) {
    notFound(); // Next.js not-found
  }
  throw error;
}
```

---

## Alias de Imports

Usar siempre `@/` para imports internos:
```ts
import { Button } from "@/components/ui/button";
import { apiServer } from "@/lib/api";
import { authClient } from "@/lib/auth/client";
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

Ver `.env.example`.

| Variable | Propósito |
|---|---|
| `API_URL` | URL interna de la API (sólo Server Components) |
| `NEXT_PUBLIC_API_URL` | URL pública de la API (accesible desde el browser) |
| `DATABASE_URL` | Conexión a Neon Postgres (para Better Auth server-side) |
| `BETTER_AUTH_SECRET` | Secret de 32+ chars para encriptación de sesiones |
| `BETTER_AUTH_URL` | URL base del frontend (`http://localhost:3000`) |
