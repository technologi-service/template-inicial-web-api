import { Elysia } from "elysia";

export const loggerMiddleware = new Elysia({ name: "logger" }).derive(
  { as: "global" },
  ({ request }) => {
    const start = Date.now();

    return {
      log: {
        start,
        request: `${request.method} ${new URL(request.url).pathname}`,
      },
    };
  }
);
