import { round2, IVA_RATE } from './money.js';

/** Calcula subtotal, IVA (13 %) y total de una lista de items { cantidad, precioUnitario }. */
export function calcularTotales(items) {
  const subtotal = round2(items.reduce((a, it) => a + it.cantidad * it.precioUnitario, 0));
  const iva = round2(subtotal * IVA_RATE);
  return { subtotal, iva, total: round2(subtotal + iva) };
}
