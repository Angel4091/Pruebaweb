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
  // Solo este origen puede llamar a la API desde el navegador.
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  // Detrás de Nginx: número de proxies de confianza, para que el límite de peticiones vea la IP real.
  trustProxy: entero(process.env.TRUST_PROXY, 0),
  // Peticiones por minuto que acepta la API desde una misma IP.
  limitePorMinuto: entero(process.env.RATE_LIMIT_POR_MINUTO, 300),
  schemaFile: path.resolve(backendRoot, '../../database/schema.sql'),
  jwt: {
    secret: process.env.JWT_SECRET || '',
    expiresIn: process.env.JWT_EXPIRES_IN || '8h',
    issuer: 'origenes-sv-api',
    audience: 'origenes-sv-web',
    algorithm: 'HS256',
  },
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

export const esProduccion = config.entorno === 'production';

/**
 * Revisa al arrancar que la configuración de seguridad sea válida.
 * Devuelve la lista de problemas (vacía si todo está bien).
 */
export function problemasDeSeguridad() {
  const problemas = [];
  if (config.jwt.secret.length < 32) {
    problemas.push('JWT_SECRET falta o es muy corto: genera uno con "openssl rand -hex 32" (uno distinto por ambiente).');
  }
  if (esProduccion && config.corsOrigin === '*') problemas.push('CORS_ORIGIN no puede ser "*" en producción.');
  return problemas;
}
