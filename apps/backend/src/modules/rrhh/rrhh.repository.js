import { pool, insertarFilas } from '../../config/database.js';
import { unaFila, todas } from '../../utils/filas.js';

/* ---------- Empleados ---------- */

const COLUMNAS_EMPLEADO = 'id, nombre, cargo, sucursal_id, salario_mensual, dui, afp, telefono, fecha_ingreso, estado';

export async function listarEmpleados({ texto, estado, sucursalId } = {}, db = pool) {
  const sql = `
    select ${COLUMNAS_EMPLEADO}
    from empleados
    where ($1::text is null or estado = $1)
      and ($2::text is null or sucursal_id = $2)
      and ($3::text is null or strpos(lower(nombre), $3) > 0 or strpos(lower(cargo), $3) > 0)
    order by orden`;
  return todas(await db.query(sql, [estado || null, sucursalId || null, texto || null]));
}

export async function obtenerEmpleado(id, db = pool) {
  return unaFila(await db.query(`select ${COLUMNAS_EMPLEADO} from empleados where id = $1`, [id]));
}

export async function existeDui(dui, excluirId, db = pool) {
  const resultado = await db.query('select 1 from empleados where dui = $1 and ($2::text is null or id <> $2)', [dui, excluirId ?? null]);
  return resultado.rowCount > 0;
}

export async function crearEmpleado(e, db = pool) {
  const sql = `
    insert into empleados (id, nombre, cargo, sucursal_id, salario_mensual, dui, afp, telefono, fecha_ingreso, estado)
    values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
    returning ${COLUMNAS_EMPLEADO}`;
  return unaFila(await db.query(sql, [e.id, e.nombre, e.cargo, e.sucursalId, e.salarioMensual, e.dui, e.afp, e.telefono, e.fechaIngreso, e.estado]));
}

export async function guardarEmpleado(e, db = pool) {
  const sql = `
    update empleados
    set nombre = $2, cargo = $3, sucursal_id = $4, salario_mensual = $5, dui = $6, afp = $7, telefono = $8,
        fecha_ingreso = $9, estado = $10, actualizado_en = now()
    where id = $1
    returning ${COLUMNAS_EMPLEADO}`;
  return unaFila(await db.query(sql, [e.id, e.nombre, e.cargo, e.sucursalId, e.salarioMensual, e.dui, e.afp, e.telefono, e.fechaIngreso, e.estado]));
}

/* ---------- Planillas ---------- */

const SELECT_PLANILLA = `
  select p.id, p.periodo_inicio, p.periodo_fin, p.etiqueta, p.fecha_generacion, p.fecha_pago, p.estado,
         coalesce((select json_agg(json_build_object(
                    'empleado_id', d.empleado_id, 'nombre', d.nombre, 'cargo', d.cargo,
                    'salario_quincenal', d.salario_quincenal, 'isss', d.isss, 'afp', d.afp,
                    'base_gravada', d.base_gravada, 'renta', d.renta, 'tramo_renta', d.tramo_renta,
                    'total_deducciones', d.total_deducciones, 'liquido', d.liquido) order by d.id)
                   from planilla_detalles d where d.planilla_id = p.id), '[]'::json) as detalles
  from planillas p`;

/** Agrupa las columnas del periodo como lo espera la API: { inicio, fin, etiqueta }. */
function aPlanilla(fila) {
  if (!fila) return null;
  const { periodoInicio, periodoFin, etiqueta, ...resto } = fila;
  return { ...resto, periodo: { inicio: periodoInicio, fin: periodoFin, etiqueta } };
}

export async function planillaDelPeriodo(inicio, db = pool) {
  return aPlanilla(unaFila(await db.query(`${SELECT_PLANILLA} where p.periodo_inicio = $1`, [inicio])));
}

export async function obtenerPlanilla(id, db = pool) {
  return aPlanilla(unaFila(await db.query(`${SELECT_PLANILLA} where p.id = $1`, [id])));
}

export async function listarPlanillas(db = pool) {
  return todas(await db.query(`${SELECT_PLANILLA} order by p.periodo_inicio desc`)).map(aPlanilla);
}

export async function insertarPlanilla(p, db) {
  await db.query(
    `insert into planillas (id, periodo_inicio, periodo_fin, etiqueta, fecha_generacion, estado)
     values ($1, $2, $3, $4, now(), 'generada')`,
    [p.id, p.periodo.inicio, p.periodo.fin, p.periodo.etiqueta],
  );
  await insertarFilas(db, 'planilla_detalles',
    ['planilla_id', 'empleado_id', 'nombre', 'cargo', 'salario_quincenal', 'isss', 'afp', 'base_gravada', 'renta', 'tramo_renta', 'total_deducciones', 'liquido'],
    p.detalles.map((d) => [p.id, d.empleadoId, d.nombre, d.cargo, d.salarioQuincenal, d.isss, d.afp, d.baseGravada, d.renta, d.tramoRenta, d.totalDeducciones, d.liquido]));
}

export async function bloquearPlanilla(id, db) {
  return unaFila(await db.query('select id, estado from planillas where id = $1 for update', [id]));
}

export async function marcarPagada(id, db) {
  await db.query("update planillas set estado = 'pagada', fecha_pago = now() where id = $1", [id]);
}
