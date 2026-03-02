/**
 * API client helper for calling the Elysia backend.
 *
 * Server Components: use `apiServer()` — bypasses the browser, hits the API directly.
 * Client Components: use `apiClient()` — goes through Next.js rewrites.
 */

const API_BASE = process.env.API_URL ?? "http://localhost:3001";
const API_PUBLIC_BASE =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

type ApiResponse<T> = {
  data: T;
  error: string | null;
  meta?: Record<string, unknown>;
};

class ApiError extends Error {
  constructor(
    public status: number,
    message: string
  ) {
    super(message);
    this.name = "ApiError";
  }
}

async function fetchJson<T>(
  baseUrl: string,
  path: string,
  init?: RequestInit
): Promise<ApiResponse<T>> {
  const url = `${baseUrl}/api/v1${path}`;

  const response = await fetch(url, {
    headers: {
      "Content-Type": "application/json",
      ...init?.headers,
    },
    ...init,
  });

  if (!response.ok) {
    throw new ApiError(response.status, `API error: ${response.statusText}`);
  }

  return response.json() as Promise<ApiResponse<T>>;
}

/**
 * For use in Server Components and Route Handlers.
 * Uses the internal API_URL (server-to-server).
 */
export function apiServer() {
  return {
    get: <T>(path: string, init?: RequestInit) =>
      fetchJson<T>(API_BASE, path, { ...init, method: "GET" }),
    post: <T>(path: string, body: unknown, init?: RequestInit) =>
      fetchJson<T>(API_BASE, path, {
        ...init,
        method: "POST",
        body: JSON.stringify(body),
      }),
    put: <T>(path: string, body: unknown, init?: RequestInit) =>
      fetchJson<T>(API_BASE, path, {
        ...init,
        method: "PUT",
        body: JSON.stringify(body),
      }),
    patch: <T>(path: string, body: unknown, init?: RequestInit) =>
      fetchJson<T>(API_BASE, path, {
        ...init,
        method: "PATCH",
        body: JSON.stringify(body),
      }),
    delete: <T>(path: string, init?: RequestInit) =>
      fetchJson<T>(API_BASE, path, { ...init, method: "DELETE" }),
  };
}

/**
 * For use in Client Components.
 * Uses NEXT_PUBLIC_API_URL (client-side, goes through rewrites in dev).
 */
export function apiClient() {
  return {
    get: <T>(path: string, init?: RequestInit) =>
      fetchJson<T>(API_PUBLIC_BASE, path, { ...init, method: "GET" }),
    post: <T>(path: string, body: unknown, init?: RequestInit) =>
      fetchJson<T>(API_PUBLIC_BASE, path, {
        ...init,
        method: "POST",
        body: JSON.stringify(body),
      }),
    put: <T>(path: string, body: unknown, init?: RequestInit) =>
      fetchJson<T>(API_PUBLIC_BASE, path, {
        ...init,
        method: "PUT",
        body: JSON.stringify(body),
      }),
    patch: <T>(path: string, body: unknown, init?: RequestInit) =>
      fetchJson<T>(API_PUBLIC_BASE, path, {
        ...init,
        method: "PATCH",
        body: JSON.stringify(body),
      }),
    delete: <T>(path: string, init?: RequestInit) =>
      fetchJson<T>(API_PUBLIC_BASE, path, { ...init, method: "DELETE" }),
  };
}

export { ApiError };
