import express from 'express';
import cors from 'cors';
import { config } from './config/env.js';
import routes from './routes/index.js';
import { errorHandler, notFoundHandler } from './middlewares/errorHandler.js';

/** Crea la aplicación Express (separada del servidor para poder probarla). */
export function createApp() {
  const app = express();
  app.use(cors({ origin: config.corsOrigin }));
  app.use(express.json({ limit: '4mb' }));

  app.use('/api', routes);
  app.use('/api', notFoundHandler);
  app.use(errorHandler);
  return app;
}
