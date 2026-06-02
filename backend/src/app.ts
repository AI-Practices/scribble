import cors from "cors";
import express from "express";
import { createApiRouter, errorHandler, notFoundHandler } from "./api/router.js";

export function createApp() {
  const app = express();

  app.use(cors());
  app.use(express.json());

  app.use("/api", createApiRouter());
  app.get("/api/health", (_request, response) => {
    response.json({ ok: true });
  });
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
