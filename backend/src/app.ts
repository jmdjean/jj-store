import express from 'express';
import cors from 'cors';
import { healthRouter } from './routes/health.routes.js';
import { errorMiddleware } from './middlewares/error.middleware.js';

export function createApp() {
  const app = express();

  app.use(cors());
  app.use(express.json());

  app.use(healthRouter);

  app.use(errorMiddleware);

  return app;
}