import { Elysia } from "elysia";
import { cors } from "@elysiajs/cors";
import { swagger } from "@elysiajs/swagger";
import { loggerMiddleware } from "./middleware/logger";
import { authMiddleware } from "./middleware/auth";
import { healthRoute } from "./routes/health.route";

const PORT = Number(Bun.env.PORT) || 3001;

export const app = new Elysia()
  .use(
    cors({
      origin: Bun.env.NODE_ENV === "production" ? false : true,
      methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    })
  )
  .use(
    swagger({
      path: "/docs",
      documentation: {
        info: {
          title: "Celta API-V1",
          version: "0.1.0",
          description: "REST API for Celta",
        },
        tags: [{ name: "Health", description: "Health check endpoints" }],
        components: {
          securitySchemes: {
            bearerAuth: {
              type: "http",
              scheme: "bearer",
              bearerFormat: "JWT",
            },
          },
        },
      },
    })
  )
  .use(loggerMiddleware)
  .use(authMiddleware)
  .group("/api/v1", (app) => app.use(healthRoute))
  .onAfterResponse(({ log, set }) => {
    if (log) {
      const duration = Date.now() - log.start;
      console.warn(`${log.request} → ${set.status ?? 200} (${duration}ms)`);
    }
  })
  .listen(PORT);

console.warn(`API running at http://localhost:${PORT}`);
console.warn(`Docs available at http://localhost:${PORT}/docs`);

export type App = typeof app;
