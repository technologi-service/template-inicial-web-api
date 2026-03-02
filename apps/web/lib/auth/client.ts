import { createAuthClient } from "better-auth/react";

// @ts-ignore: Omitir advertencias de isolatedDeclarations
export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001",
});
