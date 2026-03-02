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

## 🚀 Empezar un Nuevo Proyecto con el Template

Sigue estos pasos para usar este template como base de tu nueva aplicación.

### 1. Requisitos

- [Bun](https://bun.sh) `>= 1.2`
- Cuenta en [Neon Postgres](https://neon.tech/) o tu base de datos PostgreSQL preferida.

### 2. Clonar y Configurar

Clona el template y borra la carpeta `.git` para iniciar la historia de tu propio proyecto:

```bash
git clone https://github.com/technologi-service/template-inicial-web-api.git mi-nueva-app
cd mi-nueva-app
rm -rf .git
git init
```

*Opcional: puedes hacer un buscar/reemplazar global en todos los `package.json` para cambiar `@celta/` por el nombre de tu propio proyecto u organización.*

### 3. Instalación de Dependencias

Ejecuta el siguiente comando en la raíz del proyecto para descargar todas las dependencias:

```bash
bun install
```

### 4. Configurar Variables de Entorno

Debes crear los archivos de entorno locales copiando los ejemplos:

```bash
cp apps/web/.env.example apps/web/.env.local
cp apps/api/.env.example apps/api/.env
```

Asegúrate de editar los nuevos archivos `.env` y `.env.local`:

| Variable | App | Descripción y Configuración |
|---|---|---|
| `API_URL` / `NEXT_PUBLIC_API_URL` | `web` | URLs internas/públicas para comunicarse con el backend `api`. |
| `DATABASE_URL` | ambas | **Obligatorio:** Obtén tu connection string de Neon y ponla aquí en ambas apps. |
| `BETTER_AUTH_SECRET` | ambas | **Obligatorio:** ¡Genera uno nuevo para tu app! Puedes usar `openssl rand -base64 32`. |
| `BETTER_AUTH_URL` | ambas | URL base de la app. En dev será `http://localhost:3000` y `http://localhost:3001` respectivamente. |
| `FRONTEND_URL` / `PORT` | `api` | URL del frontend para CORS y el puerto de inicio del backend. |

### 5. Sincronizar Base de Datos (Drizzle)

Antes de levantar el servidor por primera vez, necesitas inicializar el esquema de Drizzle (incluyendo las tablas de Better Auth) en tu base de datos Neon:

```bash
cd apps/api
bun run db:push
```

### 6. Levantar Servidores (Desarrollo)

Vuelve a la raíz del monorepo (`cd ../..`) y ejecuta ambas apps en paralelo:

```bash
bun run dev
```

- **Frontend:** [http://localhost:3000](http://localhost:3000)
- **Backend (API):** [http://localhost:3001](http://localhost:3001)
- **Documentación API:** [http://localhost:3001/docs](http://localhost:3001/docs)

---

## 🛠️ Comandos Útiles

Todos los comandos se suelen ejecutar desde la raíz del monorepo con Turborepo, o dentro de la app específica para cosas concretas:

| Comando (raíz) | Descripción |
|---|---|
| `bun run dev` | Inicia `web` y `api` en paralelo con hot-reload |
| `bun run build` | Build completo de todas las apps y paquetes |
| `bun run lint` | Lint de todo el monorepo |
| `bun run check-types` | Verificación de tipos TypeScript |
| `bun run clean` | Elimina artefactos de build (`.next`, `dist`) |

### Comandos de Base de Datos (en `apps/api`)
```bash
bun run db:generate  # Genera una migración si cambias schema.ts
bun run db:migrate   # Aplica las migraciones generadas en db
bun run db:push      # Push directo del esquema a la DB (útil en dev)
bun run db:studio    # Abre la interfaz visual de Drizzle
```

---

## 🏗️ Estructura de la API

Todas las rutas viven bajo `/api/v1/`.

```
apps/api/src/
├── index.ts          — Entry point, instancia de Elysia y exports
├── auth.ts           — Configuración de Better Auth para el servidor
├── db/               — Configuración y esquemas de base de datos (Drizzle ORM)
├── routes/           — Definición de rutas HTTP
├── controllers/      — Lógica de negocio
├── models/           — Tipos y esquemas de validación (Elysia t)
└── middleware/       — Auth, CORS, logging, etc.
```

Respuesta estándar de la API:

```ts
{ data: T, error: string | null, meta?: object }
```

---

## 🖥️ Estructura del Frontend

```
apps/web/
├── app/              — Rutas y páginas (App Router)
├── components/       — Componentes React reutilizables
└── lib/
    ├── api.ts        — Clientes HTTP (apiServer / apiClient)
    └── auth/         — Configuración de cliente Better Auth
```

En `lib/api.ts` existen dos clientes HTTP para las llamadas:

- **`apiServer()`** — Para Server Components y Route Handlers (llamadas del lado del servidor).
- **`apiClient()`** — Para Client Components.

Ambos añaden el prefijo `/api/v1` a todos los requests de forma automática.

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
