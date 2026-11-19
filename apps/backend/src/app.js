import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { config } from './config/env.js';
import routes from './routes/index.js';
import { errorHandler, notFoundHandler } from './middlewares/errorHandler.js';

/** Crea la aplicación Express (separada del servidor para poder probarla). */
export function createApp() {
  const app = express();
  if (config.trustProxy > 0) app.set('trust proxy', config.trustProxy);

  // Encabezados de seguridad (CSP, nosniff, frameguard…) y sin "X-Powered-By".
  app.use(helmet());
  app.use(cors({ origin: config.corsOrigin }));

  // Límite general por IP; el inicio de sesión tiene uno propio más estricto.
  app.use('/api', rateLimit({
    windowMs: 60 * 1000,
    limit: config.limitePorMinuto,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    message: { error: 'Demasiadas solicitudes. Intenta de nuevo en un minuto.' },
  }));

  // Cuerpos JSON de 100 kb como máximo. Solo las rutas que reciben imágenes
  // en base64 aceptan más (D-09): la foto de un producto y el logo de la configuración.
  app.use('/api/productos', express.json({ limit: '1.5mb' }));
  app.use('/api/configuracion', express.json({ limit: '3mb' }));
  app.use(express.json({ limit: '100kb' }));

  app.use('/api', routes);
  app.use('/api', notFoundHandler);
  app.use(errorHandler);
  return app;
}
