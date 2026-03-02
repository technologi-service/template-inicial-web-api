import { cookies, headers } from "next/headers";
import type { Session, User } from "better-auth";

/**
 * Helper to fetch the Better Auth session from the Elysia API
 * for use in Next.js Server Components.
 */
export async function getSession(): Promise<{ session: Session; user: User } | null> {
  const cookieStore = await cookies();
  const allCookies = cookieStore
    .getAll()
    .map((c) => `${c.name}=${c.value}`)
    .join("; ");

  if (!allCookies) return null;

  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/api/auth/get-session`, {
      method: "GET",
      headers: {
        cookie: allCookies,
        ...Object.fromEntries(await headers()),
      },
      cache: "no-store",
    });

    if (!res.ok) return null;
    return res.json();
  } catch (error) {
    console.error("Failed to fetch session from API:", error);
    return null;
  }
}
