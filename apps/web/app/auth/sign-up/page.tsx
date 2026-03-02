"use client";

import { authClient } from "@/lib/auth/client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function SignUpPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const result = await authClient.signUp.email({
        name,
        email,
        password,
      });

      if (result.error) {
        setError(result.error.message ?? "Error al crear la cuenta");
      } else {
        router.push("/account");
      }
    } catch {
      setError("Error al conectar con el servidor");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-8">
      <div className="rounded-lg border p-8 w-full max-w-sm space-y-6">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold">Crear cuenta</h1>
          <p className="text-sm text-gray-500">Regístrate para empezar</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="name" className="block text-sm font-medium">
              Nombre
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Tu nombre"
              required
              className="w-full rounded-md border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-gray-300 transition-all"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="email" className="block text-sm font-medium">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tu@email.com"
              required
              className="w-full rounded-md border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-gray-300 transition-all"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="password" className="block text-sm font-medium">
              Contraseña
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              minLength={8}
              className="w-full rounded-md border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-gray-300 transition-all"
            />
            <p className="text-xs text-gray-400">Mínimo 8 caracteres</p>
          </div>

          {error && (
            <p className="text-sm text-red-600">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-md bg-black text-white px-4 py-2 text-sm font-medium hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? "Creando cuenta..." : "Crear cuenta"}
          </button>
        </form>

        <p className="text-sm text-center text-gray-500">
          ¿Ya tienes cuenta?{" "}
          <Link href="/auth/sign-in" className="text-black font-medium hover:underline">
            Inicia sesión
          </Link>
        </p>
      </div>
    </main>
  );
}
