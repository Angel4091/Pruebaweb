/** Formateadores reutilizables (moneda en USD, cantidades y fechas en es-SV). */

const moneda = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });

export const money = (value) => moneda.format(Number(value) || 0);

export const percent = (value) => `${Number(value) > 0 ? '+' : ''}${Math.round(Number(value) || 0)}%`;

/** Muestra cantidades de insumo: kg/lt pequeños en g/ml, y unidades enteras. */
export function qty(cantidad, unidad) {
  const n = Number(cantidad) || 0;
  if (unidad === 'und') return `${Number.isInteger(n) ? n : n.toFixed(1)} und`;
  if (Math.abs(n) < 1 && n !== 0) return `${Math.round(n * 1000)} ${unidad === 'kg' ? 'g' : 'ml'}`;
  return `${Number.isInteger(n) ? n : n.toFixed(1)} ${unidad}`;
}

export const fecha = (iso, opts = { day: '2-digit', month: '2-digit', year: 'numeric' }) =>
  new Date(iso.length === 10 ? `${iso}T12:00:00` : iso).toLocaleDateString('es-SV', opts);

export const hora = (iso) => new Date(iso).toLocaleTimeString('es-SV', { hour: '2-digit', minute: '2-digit' });

export const fechaLarga = (date = new Date()) =>
  date.toLocaleDateString('es-SV', { day: 'numeric', month: 'short', year: 'numeric' }).replace('.', '');

export const turnoDe = (date = new Date()) => (date.getHours() < 14 ? 'Turno mañana' : 'Turno tarde');

export function saludo(date = new Date()) {
  const h = date.getHours();
  if (h < 12) return 'Buenos días';
  if (h < 19) return 'Buenas tardes';
  return 'Buenas noches';
}

export const iniciales = (nombre = '') =>
  nombre
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0])
    .join('')
    .toUpperCase();

export const ETIQUETA_METODO = { efectivo: 'Efectivo', tarjeta: 'Tarjeta', bitcoin: 'Bitcoin (Chivo)' };
export const ETIQUETA_ORDEN = { comer_aqui: 'Comer aquí', para_llevar: 'Para llevar', delivery: 'Delivery' };
export const ETIQUETA_COMPROBANTE = { FCF: 'Factura consumidor final', CCF: 'Comprobante de crédito fiscal' };
