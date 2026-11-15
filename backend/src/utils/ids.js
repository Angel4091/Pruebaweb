import { randomUUID } from 'node:crypto';

/** Genera un identificador corto con prefijo legible, p. ej. "ven-3f2a9c1b". */
export const newId = (prefix) => `${prefix}-${randomUUID().slice(0, 8)}`;
