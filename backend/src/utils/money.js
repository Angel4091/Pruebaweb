/** Redondea un número a 2 decimales evitando errores de coma flotante. */
export const round2 = (value) => Math.round((Number(value) + Number.EPSILON) * 100) / 100;

/** Redondea cantidades de inventario a 4 decimales. */
export const round4 = (value) => Math.round((Number(value) + Number.EPSILON) * 10000) / 10000;

export const IVA_RATE = 0.13;
