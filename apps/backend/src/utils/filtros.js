import { AppError } from './AppError.js';
import { addDays, inicioDelDia } from './dates.js';

/**
 * Filtros por query string que comparten los listados de la API.
 * Cada función valida el valor y responde 400 si no tiene sentido.
 */

/**
 * ?activo=true (por defecto) solo los activos · ?activo=false solo los desactivados · ?activo=todos ambos.
 * Devuelve true, false o null (null = sin filtro), listo para la consulta: ($1::boolean is null or activo = $1).
 */
export function leerActivo(valor) {
  if (valor === undefined || valor === '' || valor === 'true') return true;
  if (valor === 'false') return false;
  if (valor === 'todos') return null;
  throw new AppError('El filtro activo debe ser true, false o todos', 400);
}

/** ?pagina=2&porPagina=20 → límite y desplazamiento para la consulta. Máximo 100 registros por página. */
export function leerPaginacion({ pagina, porPagina } = {}, porDefecto = 20) {
  const numero = Number(pagina ?? 1);
  const tamano = Number(porPagina ?? porDefecto);
  if (!Number.isInteger(numero) || numero < 1 || !Number.isInteger(tamano) || tamano < 1) {
    throw new AppError('pagina y porPagina deben ser números enteros mayores que cero', 400);
  }
  const limite = Math.min(tamano, 100);
  return { pagina: numero, porPagina: limite, limite, desplazamiento: (numero - 1) * limite };
}

/** Respuesta de un listado paginado: los registros de la página y cuántos hay en total. */
export const paginado = (datos, total, { pagina, porPagina }) => ({
  datos,
  total,
  pagina,
  porPagina,
  paginas: Math.max(1, Math.ceil(total / porPagina)),
});

const FECHA = /^\d{4}-\d{2}-\d{2}$/;

/**
 * ?desde=2026-11-01&hasta=2026-11-15 (días locales, ambos incluidos) → { desde, hasta } para
 * filtrar con fecha >= desde and fecha < hasta. Cualquiera de los dos puede faltar.
 */
export function leerRangoFechas({ desde, hasta } = {}) {
  for (const valor of [desde, hasta]) {
    if (valor && !FECHA.test(valor)) throw new AppError('Las fechas deben tener el formato AAAA-MM-DD', 400);
  }
  if (desde && hasta && desde > hasta) throw new AppError('La fecha "desde" no puede ser posterior a "hasta"', 400);
  return {
    desde: desde ? inicioDelDia(desde) : null,
    hasta: hasta ? addDays(inicioDelDia(hasta), 1) : null,
  };
}
