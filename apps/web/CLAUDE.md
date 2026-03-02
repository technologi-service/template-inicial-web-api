# apps/web — Next.js 15 Frontend

## Stack
- Framework: Next.js 15 (App Router)
- Language: TypeScript estricto
- Estilos: Tailwind CSS v4
- Puerto: `http://localhost:3000`

---

## Estructura de Directorios

```
apps/web/
├── app/              # Rutas (App Router)
│   ├── layout.tsx    # Root layout
│   ├── page.tsx      # Homepage (/)
│   └── [ruta]/
│       ├── page.tsx
│       └── layout.tsx  (opcional)
├── components/       # Componentes reutilizables
│   ├── ui/           # Componentes genéricos (Button, Input, etc.)
│   └── [feature]/    # Componentes de una feature específica
├── lib/
│   └── api.ts        # Cliente HTTP para la API
└── app/globals.css   # Estilos globales + Tailwind
```

---

## Server Components vs Client Components

**Por defecto: Server Components** (sin `"use client"`).

Usar `"use client"` SÓLO cuando el componente necesite:
- `useState`, `useEffect`, `useReducer`
- Event handlers (`onClick`, `onChange`, etc.)
- APIs del browser (`localStorage`, `window`, etc.)
- Third-party libraries que requieren el browser

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

## Llamadas a la API

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
- `API_URL` → sólo en Server (no exponer al browser)
- `NEXT_PUBLIC_API_URL` → accesible desde el browser
