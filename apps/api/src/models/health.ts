import { t } from "elysia";

export const healthResponse = t.Object({
  data: t.Object({
    status: t.String(),
    timestamp: t.String(),
    uptime: t.Number(),
    version: t.String(),
  }),
  error: t.Nullable(t.String()),
});

export type HealthResponse = typeof healthResponse;
