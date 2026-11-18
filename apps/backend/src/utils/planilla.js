import { round2 } from './money.js';

/**
 * Deducciones legales de El Salvador aplicadas a la planilla quincenal.
 *
 * - ISSS: 3 % del salario, con techo de cotización de $1,000 mensuales
 *   (máximo $30.00 al mes → $15.00 por quincena).
 * - AFP: 7.25 % del salario.
 * - Renta: tabla de retención quincenal del Impuesto sobre la Renta
 *   (Decreto Legislativo vigente), aplicada sobre el salario menos ISSS y AFP.
 */
export const ISSS_RATE = 0.03;
export const ISSS_TECHO_QUINCENAL = 15;
export const AFP_RATE = 0.0725;

/** Tabla de retención de ISR para pagos quincenales. */
export const TABLA_RENTA_QUINCENAL = [
  { tramo: 'I', desde: 0.01, hasta: 275.0, porcentaje: 0, sobreExceso: 0, cuotaFija: 0 },
  { tramo: 'II', desde: 275.01, hasta: 447.62, porcentaje: 0.1, sobreExceso: 275.0, cuotaFija: 8.83 },
  { tramo: 'III', desde: 447.63, hasta: 1019.05, porcentaje: 0.2, sobreExceso: 447.62, cuotaFija: 30.0 },
  { tramo: 'IV', desde: 1019.06, hasta: Infinity, porcentaje: 0.3, sobreExceso: 1019.05, cuotaFija: 144.28 },
];

/** Calcula la retención de renta para una base gravada quincenal. */
export function calcularRenta(baseGravada) {
  const base = round2(baseGravada);
  const tramo = TABLA_RENTA_QUINCENAL.find((t) => base >= t.desde && base <= t.hasta);
  if (!tramo || tramo.porcentaje === 0) return { renta: 0, tramo: 'I' };
  const renta = round2((base - tramo.sobreExceso) * tramo.porcentaje + tramo.cuotaFija);
  return { renta, tramo: tramo.tramo };
}

/**
 * Calcula el detalle quincenal de un empleado.
 * @param {{ id: string, nombre: string, cargo: string, salarioMensual: number }} empleado
 */
export function calcularDetalleEmpleado(empleado) {
  const salarioQuincenal = round2(empleado.salarioMensual / 2);
  const isss = round2(Math.min(salarioQuincenal * ISSS_RATE, ISSS_TECHO_QUINCENAL));
  const afp = round2(salarioQuincenal * AFP_RATE);
  const baseGravada = round2(salarioQuincenal - isss - afp);
  const { renta, tramo } = calcularRenta(baseGravada);
  const totalDeducciones = round2(isss + afp + renta);
  return {
    empleadoId: empleado.id,
    nombre: empleado.nombre,
    cargo: empleado.cargo,
    salarioQuincenal,
    isss,
    afp,
    baseGravada,
    renta,
    tramoRenta: tramo,
    totalDeducciones,
    liquido: round2(salarioQuincenal - totalDeducciones),
  };
}

/** Suma los totales de una lista de detalles de planilla. */
export function totalizarPlanilla(detalles) {
  const sum = (key) => round2(detalles.reduce((acc, d) => acc + d[key], 0));
  return {
    empleados: detalles.length,
    salarios: sum('salarioQuincenal'),
    isss: sum('isss'),
    afp: sum('afp'),
    renta: sum('renta'),
    deducciones: sum('totalDeducciones'),
    liquido: sum('liquido'),
  };
}

/** Devuelve el periodo quincenal que contiene la fecha indicada. */
export function periodoQuincenal(fecha = new Date()) {
  const d = new Date(fecha);
  const y = d.getFullYear();
  const m = d.getMonth();
  const primera = d.getDate() <= 15;
  const ultimoDia = new Date(y, m + 1, 0).getDate();
  const pad = (n) => String(n).padStart(2, '0');
  const inicio = `${y}-${pad(m + 1)}-${primera ? '01' : '16'}`;
  const fin = `${y}-${pad(m + 1)}-${primera ? '15' : pad(ultimoDia)}`;
  const mes = d.toLocaleDateString('es-SV', { month: 'short' }).replace('.', '');
  const etiqueta = primera ? `1 – 15 ${mes}. ${y}` : `16 – ${ultimoDia} ${mes}. ${y}`;
  return { inicio, fin, etiqueta };
}
