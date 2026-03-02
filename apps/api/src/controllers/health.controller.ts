const VERSION = "0.1.0";
const START_TIME = Date.now();

export const healthController = {
  get() {
    return {
      data: {
        status: "ok",
        timestamp: new Date().toISOString(),
        uptime: Math.floor((Date.now() - START_TIME) / 1000),
        version: VERSION,
      },
      error: null,
    };
  },
};
