/** Redondea un número a 2 decimales evitando errores de coma flotante. */
export const round2 = (value) => Math.round((Number(value) + Number.EPSILON) * 100) / 100;

/** Redondea cantidades de inventario a 4 decimales. */
export const round4 = (value) => Math.round((Number(value) + Number.EPSILON) * 10000) / 10000;

export const IVA_RATE = 0.13;

/** Valor sin IVA de un monto que ya lo incluye (un café de $3.50 vale $3.10 sin IVA). */
export const sinIva = (monto) => round2(Number(monto) / (1 + IVA_RATE));

/**
 * Desglosa el IVA de un comprobante cuyos precios ya lo incluyen (D-14).
 * - total: lo que paga el cliente (la suma de las líneas, tal como dice el menú).
 * - subtotal: la suma de cada línea sin IVA (así cuadran las líneas del crédito fiscal).
 * - iva: la diferencia entre ambos.
 * @param {number[]} totalesDeLinea total de cada línea con IVA incluido
 */
export function desglosarIva(totalesDeLinea) {
  const total = round2(totalesDeLinea.reduce((a, t) => a + Number(t), 0));
  const subtotal = round2(totalesDeLinea.reduce((a, t) => a + sinIva(t), 0));
  return { subtotal, iva: round2(total - subtotal), total };
}
