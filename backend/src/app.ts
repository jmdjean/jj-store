import express from 'express';
import cors from 'cors';
import { healthRouter } from './routes/health.routes.js';
import { authRouter } from './routes/auth.routes.js';
import { adminRouter } from './routes/admin.routes.js';
import { meRouter } from './routes/me.routes.js';
import { productsRouter } from './routes/products.routes.js';
import { cartRouter } from './routes/cart.routes.js';
import { errorMiddleware } from './middlewares/error.middleware.js';

export function createApp() {
  const app = express();

  app.use(cors());
  app.use(express.json());

  app.use(healthRouter);
  app.use(authRouter);
  app.use(adminRouter);
  app.use(meRouter);
  app.use(productsRouter);
  app.use(cartRouter);

  app.use(errorMiddleware);

  return app;
}
