"use client";

import { authClient } from "@/lib/auth/client";

export default function SignInPage() {
  return (
    <main className="min-h-screen flex items-center justify-center p-8">
      <div className="rounded-lg border p-8 w-full max-w-sm space-y-6">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold">Iniciar sesión</h1>
          <p className="text-sm text-gray-500">Accede a tu cuenta</p>
        </div>

        <div className="space-y-3">
          <button
            onClick={() => authClient.signIn.social({ provider: "github", callbackURL: "/account" })}
            className="w-full rounded-md border px-4 py-2 text-sm font-medium hover:bg-gray-50 transition-colors"
          >
            Continuar con GitHub
          </button>
          <button
            onClick={() => authClient.signIn.social({ provider: "google", callbackURL: "/account" })}
            className="w-full rounded-md border px-4 py-2 text-sm font-medium hover:bg-gray-50 transition-colors"
          >
            Continuar con Google
          </button>
        </div>
      </div>
    </main>
  );
}
