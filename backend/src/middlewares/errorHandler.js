import { AppError } from '../utils/AppError.js';

/** Responde 404 para rutas de la API que no existen. */
export const notFoundHandler = (req, res) => {
  res.status(404).json({ error: `Ruta ${req.method} ${req.originalUrl} no encontrada` });
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
  console.error('❌ Error inesperado:', err);
  return res.status(500).json({ error: 'Error interno del servidor' });
};
