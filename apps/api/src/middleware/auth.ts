import { Elysia } from "elysia";
import { jwtVerify, createRemoteJWKSet } from "jose";

type NeonAuthPayload = {
  sub: string;
  id: string;
  name: string | null;
  email: string;
  emailVerified: boolean;
  image: string | null;
  role: string;
  iat: number;
  exp: number;
  iss: string;
  aud: string;
};

const BASE = Bun.env.NEON_AUTH_BASE_URL;
let jwks: ReturnType<typeof createRemoteJWKSet> | null = null;

function getJwks() {
  if (!BASE) throw new Error("NEON_AUTH_BASE_URL is not set");
  if (!jwks)
    jwks = createRemoteJWKSet(new URL(`${BASE}/.well-known/jwks.json`));
  return jwks;
}

export const authMiddleware = new Elysia({ name: "auth" }).derive(
  { as: "global" },
  async ({ request }) => {
    const header = request.headers.get("authorization");
    if (!header?.startsWith("Bearer ")) return { user: null };
    const token = header.slice(7);
    try {
      const { payload } = await jwtVerify(token, getJwks(), {
        issuer: new URL(BASE!).origin,
      });
      return { user: payload as NeonAuthPayload };
    } catch {
      return { user: null };
    }
  }
);

export const requireAuth = new Elysia({ name: "require-auth" })
  .use(authMiddleware)
  .derive({ as: "local" }, ({ user, set }) => {
    if (!user) {
      set.status = 401;
      throw new Error("Unauthorized");
    }
    return { user };
  });
