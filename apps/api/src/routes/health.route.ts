import { Elysia } from "elysia";
import { healthController } from "../controllers/health.controller";
import { healthResponse } from "../models/health";

export const healthRoute = new Elysia({ prefix: "/health" }).get(
  "/",
  () => healthController.get(),
  {
    response: healthResponse,
    detail: {
      tags: ["Health"],
      summary: "Health check",
      description: "Returns API health status and uptime",
    },
  }
);
