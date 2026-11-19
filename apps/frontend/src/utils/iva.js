/**
 * IVA incluido en el precio (D-14). Es el mismo cálculo de la API (apps/backend/src/utils/money.js);
 * aquí solo sirve para mostrar la orden antes de cobrar. El comprobante usa los montos que devuelve la API.
 */
export const IVA_RATE = 0.13;

const r2 = (n) => Math.round((Number(n) + Number.EPSILON) * 100) / 100;

/** Valor sin IVA de un monto que ya lo incluye. */
export const sinIva = (monto) => r2(Number(monto) / (1 + IVA_RATE));

/** { subtotal (sin IVA), iva, total } de una lista de totales de línea con IVA incluido. */
export function desglosarIva(totalesDeLinea) {
  const total = r2(totalesDeLinea.reduce((a, t) => a + Number(t), 0));
  const subtotal = r2(totalesDeLinea.reduce((a, t) => a + sinIva(t), 0));
  return { subtotal, iva: r2(total - subtotal), total };
}
