"use client";

import { authClient } from "@/lib/auth/client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

type Session = Awaited<ReturnType<typeof authClient.getSession>>;

export default function AccountPage() {
  const router = useRouter();
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    authClient.getSession().then(setSession);
  }, []);

  async function handleSignOut() {
    await authClient.signOut();
    router.push("/");
  }

  const user = session?.data?.user;

  return (
    <main className="min-h-screen flex items-center justify-center p-8">
      <div className="rounded-lg border p-8 w-full max-w-sm space-y-6">
        <h1 className="text-2xl font-bold">Mi cuenta</h1>

        {user ? (
          <div className="space-y-4">
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-gray-500">Nombre</dt>
                <dd className="font-medium">{user.name ?? "—"}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">Email</dt>
                <dd className="font-mono">{user.email}</dd>
              </div>
            </dl>

            <button
              onClick={handleSignOut}
              className="w-full rounded-md border px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
            >
              Cerrar sesión
            </button>
          </div>
        ) : (
          <p className="text-sm text-gray-500">Cargando sesión...</p>
        )}
      </div>
    </main>
  );
}
