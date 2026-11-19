import { AppError } from '../utils/AppError.js';

/** Grupos de roles que se repiten en las rutas (ver docs/decisiones.md, D-04). */
export const ROLES = ['admin', 'gerente', 'cajero', 'barista'];
export const TODOS = ROLES;
export const GESTION = ['admin', 'gerente'];
export const CAJA = ['admin', 'gerente', 'cajero'];
export const SOLO_ADMIN = ['admin'];

const SIN_PERMISO = 'No tienes permiso para esta acción';

/** 403 si el rol del usuario no está entre los permitidos. */
export const permitir = (...roles) => {
  const permitidos = roles.flat();
  return (req, res, next) => {
    if (!req.usuario) throw new AppError('Autenticación requerida', 401);
    if (!permitidos.includes(req.usuario.rol)) throw new AppError(SIN_PERMISO, 403);
    next();
  };
};

/** El admin trabaja con todas las sucursales; los demás, solo con la suya. */
export const puedeVerSucursal = (usuario, sucursalId) => usuario.rol === 'admin' || usuario.sucursalId === sucursalId;

/** Sucursal para las consultas que la aceptan opcional: los que no son admin siempre ven la suya. */
export const sucursalDe = (req) => (req.usuario.rol === 'admin' ? req.query.sucursalId : req.usuario.sucursalId);

/**
 * Si la petición menciona una sucursal (en ?sucursalId= o en el cuerpo),
 * tiene que ser la del usuario, salvo para el admin.
 */
export function limitarASuSucursal(req, res, next) {
  const pedidas = [req.query?.sucursalId, req.body?.sucursalId].filter(Boolean);
  if (pedidas.some((s) => !puedeVerSucursal(req.usuario, s))) throw new AppError('No tienes acceso a esa sucursal', 403);
  next();
}

/**
 * Comprueba que el recurso pertenezca a la sucursal del usuario.
 * obtenerSucursal(req) devuelve la sucursal del recurso (o lanza 404 si no existe).
 */
export const deSuSucursal = (obtenerSucursal) => async (req, res, next) => {
  const sucursalId = await obtenerSucursal(req);
  if (!puedeVerSucursal(req.usuario, sucursalId)) throw new AppError('No tienes acceso a esa sucursal', 403);
  next();
};
