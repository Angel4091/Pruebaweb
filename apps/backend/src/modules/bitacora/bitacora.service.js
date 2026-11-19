import { AppError } from '../../utils/AppError.js';
import { leerPaginacion, leerRangoFechas, paginado } from '../../utils/filtros.js';
import { describirError } from '../../config/database.js';
import * as repo from './bitacora.repository.js';

/** Campos que nunca se guardan en la bitácora (secretos e imágenes en base64). */
const CAMPOS_OCULTOS = new Set(['password', 'passwordHash', 'token', 'imagen', 'logo']);

/**
 * Copia del cuerpo de la petición apta para guardarse: sin contraseñas ni imágenes,
 * con textos largos recortados y a lo sumo 3 niveles de profundidad.
 */
export function resumirDatos(valor, nivel = 0) {
  if (valor === null || valor === undefined) return valor ?? null;
  if (typeof valor === 'string') return valor.length > 120 ? `${valor.slice(0, 120)}…` : valor;
  if (typeof valor !== 'object') return valor;
  if (nivel >= 3) return '…';
  if (Array.isArray(valor)) return valor.slice(0, 20).map((v) => resumirDatos(v, nivel + 1));
  return Object.fromEntries(
    Object.entries(valor)
      .filter(([clave]) => !CAMPOS_OCULTOS.has(clave))
      .map(([clave, v]) => [clave, resumirDatos(v, nivel + 1)]),
  );
}

/**
 * Guarda un registro en la bitácora. Si falla, solo lo anota en la consola del servidor:
 * un problema con la bitácora no debe deshacer ni bloquear la operación del usuario.
 */
export async function registrar(entrada) {
  try {
    await repo.insertarRegistro(entrada);
  } catch (err) {
    console.error(`⚠️  No se pudo guardar en la bitácora (${entrada.accion} ${entrada.entidad}): ${describirError(err)}`);
  }
}

/** Consulta de la bitácora con filtros (usuario, módulo, acción, fechas) y paginación en el servidor. */
export async function listarBitacora({ usuarioId, entidad, accion, desde, hasta, pagina, porPagina } = {}) {
  if (usuarioId !== undefined && usuarioId !== '' && !/^\d+$/.test(String(usuarioId))) {
    throw new AppError('usuarioId debe ser un número', 400);
  }
  const paginacion = leerPaginacion({ pagina, porPagina });
  const { filas, total } = await repo.listarRegistros(
    { usuarioId: usuarioId ? Number(usuarioId) : null, entidad, accion, ...leerRangoFechas({ desde, hasta }) },
    paginacion,
  );
  return paginado(filas, total, paginacion);
}
