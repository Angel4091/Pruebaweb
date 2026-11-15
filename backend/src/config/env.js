import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const backendRoot = path.resolve(__dirname, '..', '..');

/** Configuración centralizada de la API (se puede sobreescribir con variables de entorno). */
export const config = {
  port: Number(process.env.PORT) || 3000,
  corsOrigin: process.env.CORS_ORIGIN || '*',
  dataFile: path.resolve(backendRoot, process.env.DATA_FILE || '../database/data.json'),
  seedFile: path.resolve(backendRoot, '../database/seeds/seed.mjs'),
};
