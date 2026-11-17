import { scryptSync, randomBytes, timingSafeEqual, createHmac } from 'node:crypto';

/**
 * Utilidades de seguridad sin dependencias externas:
 * - Contraseñas: scrypt con sal aleatoria, guardadas como "scrypt$<sal>$<hash>".
 * - Tokens: formato JWT (HS256) firmado con HMAC-SHA256 y con vencimiento.
 */

const LARGO_HASH = 64;

export function hashPassword(password) {
  const sal = randomBytes(16).toString('hex');
  const hash = scryptSync(String(password), sal, LARGO_HASH).toString('hex');
  return `scrypt$${sal}$${hash}`;
}

export function verificarPassword(password, guardado) {
  const [algoritmo, sal, hash] = String(guardado ?? '').split('$');
  if (algoritmo !== 'scrypt' || !sal || !hash) return false;
  const esperado = Buffer.from(hash, 'hex');
  const calculado = scryptSync(String(password), sal, esperado.length);
  return calculado.length === esperado.length && timingSafeEqual(calculado, esperado);
}

const b64url = (valor) => Buffer.from(typeof valor === 'string' ? valor : JSON.stringify(valor)).toString('base64url');

/** Firma un token con los datos del usuario. `duracionSeg` por defecto: 8 horas (un turno). */
export function firmarToken(payload, secreto, duracionSeg = 8 * 60 * 60) {
  const ahora = Math.floor(Date.now() / 1000);
  const cuerpo = `${b64url({ alg: 'HS256', typ: 'JWT' })}.${b64url({ ...payload, iat: ahora, exp: ahora + duracionSeg })}`;
  const firma = createHmac('sha256', secreto).update(cuerpo).digest('base64url');
  return `${cuerpo}.${firma}`;
}

/** Verifica firma y vencimiento. Devuelve el payload o null si el token no es válido. */
export function verificarToken(token, secreto) {
  const partes = String(token ?? '').split('.');
  if (partes.length !== 3) return null;
  const [cabecera, datos, firma] = partes;
  const esperada = createHmac('sha256', secreto).update(`${cabecera}.${datos}`).digest();
  const recibida = Buffer.from(firma, 'base64url');
  if (recibida.length !== esperada.length || !timingSafeEqual(recibida, esperada)) return null;
  try {
    const payload = JSON.parse(Buffer.from(datos, 'base64url').toString());
    if (typeof payload.exp !== 'number' || payload.exp < Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch {
    return null;
  }
}
