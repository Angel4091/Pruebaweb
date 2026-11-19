import path from 'node:path';
import crypto from 'node:crypto';
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
// Sin .env (por ejemplo en un clon nuevo) se usa un secreto aleatorio que solo vive durante la prueba.
process.env.JWT_SECRET ||= crypto.randomBytes(32).toString('hex');

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

/**
 * Cliente HTTP mínimo para las pruebas de la API: pedir(ruta, { method, body, token }).
 * El cuerpo se envía como JSON; la respuesta trae status, body y headers.
 */
export function clienteApi(obtenerBase) {
  return async (ruta, { token, body, headers = {}, ...opciones } = {}) => {
    const res = await fetch(`${obtenerBase()}${ruta}`, {
      ...opciones,
      headers: { 'content-type': 'application/json', ...(token ? { authorization: `Bearer ${token}` } : {}), ...headers },
      body: body === undefined || typeof body === 'string' ? body : JSON.stringify(body),
    });
    const texto = await res.text();
    return { status: res.status, body: texto ? JSON.parse(texto) : null, headers: res.headers };
  };
}

/** Inicia sesión con un usuario de demo (admin, gerente, cajero o barista) y devuelve el token. */
export async function tokenDe(pedir, rol) {
  const { status, body } = await pedir('/auth/login', {
    method: 'POST',
    body: { email: `${rol}@origenes.test`, password: process.env.SEED_PASSWORD },
  });
  if (status !== 200) throw new Error(`No se pudo iniciar sesión como ${rol} (${status})`);
  return body.token;
}

export { pool, cerrarPool };
