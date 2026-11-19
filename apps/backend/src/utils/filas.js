/**
 * PostgreSQL usa nombres en snake_case (stock_minimo) y la API responde en
 * camelCase (stockMinimo). Estas funciones convierten las filas que devuelven
 * los repositorios, incluidos los objetos JSON anidados.
 */
const aCamelTexto = (clave) => clave.replace(/_([a-z0-9])/g, (_, letra) => letra.toUpperCase());

export function aCamel(valor) {
  if (Array.isArray(valor)) return valor.map(aCamel);
  if (valor && typeof valor === 'object' && !(valor instanceof Date)) {
    return Object.fromEntries(Object.entries(valor).map(([clave, v]) => [aCamelTexto(clave), aCamel(v)]));
  }
  return valor;
}

/** Primera fila del resultado (o null) ya convertida. */
export const unaFila = (resultado) => (resultado.rows[0] ? aCamel(resultado.rows[0]) : null);

/** Todas las filas del resultado ya convertidas. */
export const todas = (resultado) => aCamel(resultado.rows);
