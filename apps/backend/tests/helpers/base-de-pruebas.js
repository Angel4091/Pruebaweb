import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';

/**
 * Las pruebas usan su propia base (DB_NAME_TEST, por defecto "origenes_test")
 * para no tocar los datos de desarrollo. Este archivo debe importarse antes que
 * cualquier módulo de la API.
 */
const backendRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
dotenv.config({ path: path.join(backendRoot, '.env'), quiet: true });
process.env.DB_NAME = process.env.DB_NAME_TEST || 'origenes_test';
process.env.SEED_PASSWORD ||= 'clave-solo-para-pruebas';

const { probarConexion, aplicarEsquema, withTransaction, cerrarPool, pool } = await import('../../src/config/database.js');
const { cargarDatosDemo } = await import('../../src/config/datos-demo.js');

/**
 * Crea el esquema y carga los datos de demo en la base de pruebas.
 * Devuelve false si PostgreSQL no está disponible (las pruebas que lo necesitan se omiten).
 */
export async function prepararBase() {
  try {
    await probarConexion();
  } catch {
    return false;
  }
  await aplicarEsquema();
  await withTransaction((client) => cargarDatosDemo(client));
  return true;
}

export const MOTIVO_SIN_BASE = 'PostgreSQL no está disponible: levántalo con npm run db:up';

export { pool, cerrarPool };
