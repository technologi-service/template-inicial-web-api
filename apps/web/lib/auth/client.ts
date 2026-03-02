"use client";

import { createAuthClient } from "@neondatabase/auth/next";

// Explicit annotation to avoid TS2742 with complex better-auth inferred types
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const authClient: ReturnType<typeof createAuthClient> = createAuthClient() as any;
