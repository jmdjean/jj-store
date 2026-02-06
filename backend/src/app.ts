import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import cors from 'cors';
import { healthRouter } from './routes/health.routes.js';
import { authRouter } from './routes/auth.routes.js';
import { adminRouter } from './routes/admin.routes.js';
import { meRouter } from './routes/me.routes.js';
import { productsRouter } from './routes/products.routes.js';
import { cartRouter } from './routes/cart.routes.js';
import { errorMiddleware } from './middlewares/error.middleware.js';
import { env } from './config/env.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const STATIC_EXTENSIONS = new Set([
  '.js',
  '.mjs',
  '.css',
  '.ico',
  '.svg',
  '.png',
  '.jpg',
  '.jpeg',
  '.gif',
  '.webp',
  '.woff',
  '.woff2',
  '.ttf',
  '.eot',
  '.json',
]);

function resolveFrontendDist(): string {
  const fromDirname = path.resolve(__dirname, '..', '..', 'frontend', 'dist', 'frontend', 'browser');
  if (fs.existsSync(fromDirname)) {
    return fromDirname;
  }
  const fromCwd = path.resolve(process.cwd(), '..', 'frontend', 'dist', 'frontend', 'browser');
  if (fs.existsSync(fromCwd)) {
    return fromCwd;
  }
  return fromDirname;
}

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

  if (env.nodeEnv === 'production') {
    const frontendDist = resolveFrontendDist();
    if (!fs.existsSync(frontendDist)) {
      console.warn(
        `[frontend] Static directory not found at ${frontendDist}. SPA and static files will not be served.`,
      );
    } else {
      app.use(express.static(frontendDist, { index: false }));
      app.get('*', (req, res) => {
        const ext = path.extname(req.path);
        if (STATIC_EXTENSIONS.has(ext)) {
          res.status(404).end();
          return;
        }
        res.sendFile(path.join(frontendDist, 'index.html'));
      });
    }
  }

  app.use(errorMiddleware);

  return app;
}
