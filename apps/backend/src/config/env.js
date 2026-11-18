import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const backendRoot = path.resolve(__dirname, '..', '..');

// Lee apps/backend/.env. Las variables que ya existan en el proceso tienen prioridad
// (así las pruebas pueden apuntar a la base de pruebas).
dotenv.config({ path: path.join(backendRoot, '.env'), quiet: true });

const entero = (valor, porDefecto) => {
  const n = Number.parseInt(valor, 10);
  return Number.isNaN(n) ? porDefecto : n;
};

/** Configuración centralizada de la API, tomada de las variables de entorno. */
export const config = {
  entorno: process.env.NODE_ENV || 'development',
  port: entero(process.env.PORT, 3000),
  corsOrigin: process.env.CORS_ORIGIN || '*',
  dataFile: path.resolve(backendRoot, process.env.DATA_FILE || '../../database/data.json'),
  seedFile: path.resolve(backendRoot, '../../database/seeds/seed.mjs'),
  schemaFile: path.resolve(backendRoot, '../../database/schema.sql'),
  db: {
    host: process.env.DB_HOST || 'localhost',
    port: entero(process.env.DB_PORT, 5432),
    database: process.env.DB_NAME || 'origenes',
    user: process.env.DB_USER || 'origenes',
    password: process.env.DB_PASSWORD || '',
    ssl: process.env.DB_SSL === 'true',
    sslCa: process.env.DB_SSL_CA || '',
  },
  seedPassword: process.env.SEED_PASSWORD || '',
};
