import { db } from '../config/db.js';
import { AppError, notFound } from '../utils/AppError.js';
import { newId } from '../utils/ids.js';
import { calcularDetalleEmpleado, totalizarPlanilla, periodoQuincenal } from '../utils/planilla.js';

export const CARGOS = ['Gerente general', 'Gerente de sucursal', 'Cajero', 'Cajera', 'Barista', 'Cocinero', 'Cocinera', 'Ayudante de cocina', 'Mesero', 'Mesera'];

/* ---------- Empleados ---------- */

export function listarEmpleados({ q, estado, sucursalId } = {}) {
  const texto = q?.toLowerCase().trim();
  return db
    .collection('empleados')
    .filter((e) => !estado || e.estado === estado)
    .filter((e) => !sucursalId || e.sucursalId === sucursalId)
    .filter((e) => !texto || e.nombre.toLowerCase().includes(texto) || e.cargo.toLowerCase().includes(texto));
}

function validarEmpleado(data, parcial = false) {
  if (!parcial || data.salarioMensual !== undefined) {
    const salario = Number(data.salarioMensual);
    if (!(salario > 0)) throw new AppError('El salario mensual debe ser mayor que cero', 422);
  }
  if (data.dui !== undefined && data.dui !== '' && !/^\d{8}-\d$/.test(data.dui)) {
    throw new AppError('El DUI debe tener el formato 00000000-0', 422);
  }
}

export function crearEmpleado(data) {
  validarEmpleado(data);
  if (data.dui && db.collection('empleados').some((e) => e.dui === data.dui)) throw new AppError('Ya existe un empleado con ese DUI', 409);
  const empleado = {
    id: newId('emp'),
    nombre: String(data.nombre).trim(),
    cargo: data.cargo,
    sucursalId: data.sucursalId ?? 'suc-central',
    salarioMensual: Number(data.salarioMensual),
    dui: data.dui ?? '',
    afp: data.afp ?? 'AFP Confía',
    telefono: data.telefono ?? '',
    fechaIngreso: data.fechaIngreso ?? new Date().toISOString().slice(0, 10),
    estado: 'activo',
  };
  db.collection('empleados').push(empleado);
  db.save();
  return empleado;
}

export function actualizarEmpleado(id, data) {
  const emp = db.collection('empleados').find((e) => e.id === id);
  if (!emp) throw notFound('Empleado');
  validarEmpleado(data, true);
  for (const key of ['nombre', 'cargo', 'sucursalId', 'salarioMensual', 'dui', 'afp', 'telefono', 'fechaIngreso', 'estado']) {
    if (data[key] !== undefined) emp[key] = key === 'salarioMensual' ? Number(data[key]) : data[key];
  }
  db.save();
  return emp;
}

/** Baja de empleado: se marca como inactivo para conservar su historial de planillas. */
export function darDeBajaEmpleado(id) {
  return actualizarEmpleado(id, { estado: 'inactivo' });
}

/* ---------- Planilla quincenal ---------- */

/** Vista previa de la planilla del periodo (no se guarda). */
export function calcularPlanilla(fecha) {
  const periodo = periodoQuincenal(fecha ? new Date(`${fecha}T12:00:00`) : new Date());
  const detalles = listarEmpleados({ estado: 'activo' }).map(calcularDetalleEmpleado);
  const existente = db.collection('planillas').find((p) => p.periodo.inicio === periodo.inicio);
  return { periodo, detalles, totales: totalizarPlanilla(detalles), estado: existente?.estado ?? 'borrador', id: existente?.id ?? null };
}

/** Genera y guarda la planilla del periodo. No se permite duplicar periodos. */
export function generarPlanilla(fecha) {
  const preview = calcularPlanilla(fecha);
  if (preview.id) throw new AppError(`La planilla del periodo ${preview.periodo.etiqueta} ya fue generada`, 409);
  if (preview.detalles.length === 0) throw new AppError('No hay empleados activos para generar la planilla', 422);
  const planilla = {
    id: newId('pla'),
    periodo: preview.periodo,
    fechaGeneracion: new Date().toISOString(),
    fechaPago: null,
    estado: 'generada',
    detalles: preview.detalles,
    totales: preview.totales,
  };
  db.collection('planillas').push(planilla);
  db.save();
  return planilla;
}

export function pagarPlanilla(id) {
  const planilla = db.collection('planillas').find((p) => p.id === id);
  if (!planilla) throw notFound('Planilla');
  if (planilla.estado === 'pagada') throw new AppError('La planilla ya fue pagada', 409);
  planilla.estado = 'pagada';
  planilla.fechaPago = new Date().toISOString();
  db.save();
  return planilla;
}

export const listarPlanillas = () =>
  db.collection('planillas').slice().sort((a, b) => b.periodo.inicio.localeCompare(a.periodo.inicio));

export function obtenerPlanilla(id) {
  const planilla = db.collection('planillas').find((p) => p.id === id);
  if (!planilla) throw notFound('Planilla');
  return planilla;
}
