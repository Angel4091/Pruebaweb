import { withTransaction } from '../../config/database.js';
import { AppError, notFound } from '../../utils/AppError.js';
import { newId } from '../../utils/ids.js';
import { calcularDetalleEmpleado, totalizarPlanilla, periodoQuincenal } from '../../utils/planilla.js';
import { validarSucursal } from '../general/general.service.js';
import * as repo from './rrhh.repository.js';

export const CARGOS = ['Gerente general', 'Gerente de sucursal', 'Cajero', 'Cajera', 'Barista', 'Cocinero', 'Cocinera', 'Ayudante de cocina', 'Mesero', 'Mesera'];
const ESTADOS = ['activo', 'inactivo'];

/* ---------- Empleados ---------- */

export const listarEmpleados = ({ q, estado, sucursalId } = {}) =>
  repo.listarEmpleados({ texto: q?.toLowerCase().trim(), estado, sucursalId });

function validarEmpleado(data, parcial = false) {
  if (!parcial || data.salarioMensual !== undefined) {
    const salario = Number(data.salarioMensual);
    if (!(salario > 0)) throw new AppError('El salario mensual debe ser mayor que cero', 422);
  }
  if (data.dui !== undefined && data.dui !== '' && !/^\d{8}-\d$/.test(data.dui)) {
    throw new AppError('El DUI debe tener el formato 00000000-0', 422);
  }
  if (data.estado !== undefined && !ESTADOS.includes(data.estado)) throw new AppError('El estado debe ser activo o inactivo', 422);
}

export async function crearEmpleado(data) {
  validarEmpleado(data);
  if (data.dui && (await repo.existeDui(data.dui))) throw new AppError('Ya existe un empleado con ese DUI', 409);
  const sucursalId = data.sucursalId ?? 'suc-central';
  await validarSucursal(sucursalId);
  return repo.crearEmpleado({
    id: newId('emp'),
    nombre: String(data.nombre).trim(),
    cargo: data.cargo,
    sucursalId,
    salarioMensual: Number(data.salarioMensual),
    dui: data.dui ?? '',
    afp: data.afp ?? 'AFP Confía',
    telefono: data.telefono ?? '',
    fechaIngreso: data.fechaIngreso ?? new Date().toISOString().slice(0, 10),
    estado: 'activo',
  });
}

export async function actualizarEmpleado(id, data) {
  const emp = await repo.obtenerEmpleado(id);
  if (!emp) throw notFound('Empleado');
  validarEmpleado(data, true);
  if (data.dui && (await repo.existeDui(data.dui, id))) throw new AppError('Ya existe un empleado con ese DUI', 409);
  if (data.sucursalId !== undefined) await validarSucursal(data.sucursalId);
  for (const key of ['nombre', 'cargo', 'sucursalId', 'salarioMensual', 'dui', 'afp', 'telefono', 'fechaIngreso', 'estado']) {
    if (data[key] !== undefined) emp[key] = key === 'salarioMensual' ? Number(data[key]) : data[key];
  }
  return repo.guardarEmpleado(emp);
}

/** Baja de empleado: se marca como inactivo para conservar su historial de planillas. */
export const darDeBajaEmpleado = (id) => actualizarEmpleado(id, { estado: 'inactivo' });

/* ---------- Planilla quincenal ---------- */

const conTotales = (planilla) => (planilla ? { ...planilla, totales: totalizarPlanilla(planilla.detalles) } : null);

/** Vista previa de la planilla del periodo (no se guarda). */
export async function calcularPlanilla(fecha, db) {
  const periodo = periodoQuincenal(fecha ? new Date(`${fecha}T12:00:00`) : new Date());
  const empleados = await repo.listarEmpleados({ estado: 'activo' }, db);
  const detalles = empleados.map(calcularDetalleEmpleado);
  const existente = await repo.planillaDelPeriodo(periodo.inicio, db);
  return { periodo, detalles, totales: totalizarPlanilla(detalles), estado: existente?.estado ?? 'borrador', id: existente?.id ?? null };
}

/**
 * Genera y guarda la planilla del periodo con todos sus detalles en una transacción.
 * No se permite duplicar periodos (además, la columna periodo_inicio es única).
 */
export async function generarPlanilla(fecha) {
  return withTransaction(async (client) => {
    const preview = await calcularPlanilla(fecha, client);
    if (preview.id) throw new AppError(`La planilla del periodo ${preview.periodo.etiqueta} ya fue generada`, 409);
    if (preview.detalles.length === 0) throw new AppError('No hay empleados activos para generar la planilla', 422);
    const id = newId('pla');
    await repo.insertarPlanilla({ id, periodo: preview.periodo, detalles: preview.detalles }, client);
    return conTotales(await repo.obtenerPlanilla(id, client));
  });
}

export async function pagarPlanilla(id) {
  return withTransaction(async (client) => {
    const planilla = await repo.bloquearPlanilla(id, client);
    if (!planilla) throw notFound('Planilla');
    if (planilla.estado === 'pagada') throw new AppError('La planilla ya fue pagada', 409);
    await repo.marcarPagada(id, client);
    return conTotales(await repo.obtenerPlanilla(id, client));
  });
}

export const listarPlanillas = async () => (await repo.listarPlanillas()).map(conTotales);

export async function obtenerPlanilla(id) {
  const planilla = await repo.obtenerPlanilla(id);
  if (!planilla) throw notFound('Planilla');
  return conTotales(planilla);
}
