import type { Handler } from "serverless-http";
import serverless from "serverless-http";
import { createApp } from "../../backend/src/app.js";

const app = createApp();

export const handler: Handler = serverless(app);
