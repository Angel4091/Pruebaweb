import { AppError } from '../utils/AppError.js';

/** Responde 404 para rutas de la API que no existen. */
export const notFoundHandler = (req, res) => {
  res.status(404).json({ error: `Ruta ${req.method} ${req.originalUrl} no encontrada` });
};

/**
 * Errores de PostgreSQL que pueden deberse a datos del usuario. Se responden con
 * un mensaje genérico: nunca se envía el texto original de la base de datos.
 * https://www.postgresql.org/docs/current/errcodes-appendix.html
 */
const ERRORES_POSTGRES = {
  23505: { status: 409, error: 'El registro ya existe' },
  23503: { status: 422, error: 'El registro hace referencia a datos que no existen' },
  23514: { status: 422, error: 'Los datos no cumplen las reglas del sistema' },
  23502: { status: 422, error: 'Falta un dato obligatorio' },
  '22P02': { status: 400, error: 'Un dato tiene un formato inválido' },
  22003: { status: 422, error: 'Un número está fuera del rango permitido' },
  '40P01': { status: 409, error: 'Otra operación estaba usando los mismos datos. Intenta de nuevo.' },
};

/** Manejador central de errores: traduce excepciones a respuestas JSON. */
// eslint-disable-next-line no-unused-vars
export const errorHandler = (err, req, res, next) => {
  if (err instanceof AppError) {
    return res.status(err.status).json({ error: err.message, details: err.details });
  }
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'El cuerpo de la petición no es un JSON válido' });
  }
  if (err.type === 'entity.too.large') {
    return res.status(413).json({ error: 'La petición es demasiado grande' });
  }
  const conocido = ERRORES_POSTGRES[err.code];
  if (conocido) {
    console.warn(`⚠️  ${req.method} ${req.originalUrl}: ${err.code} ${err.constraint ?? ''}`.trim());
    return res.status(conocido.status).json({ error: conocido.error });
  }
  console.error('❌ Error inesperado:', err);
  return res.status(500).json({ error: 'Error interno del servidor' });
};
