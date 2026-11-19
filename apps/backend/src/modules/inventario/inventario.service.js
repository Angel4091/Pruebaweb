import { usarTransaccion, withTransaction } from '../../config/database.js';
import { AppError, notFound } from '../../utils/AppError.js';
import { round2, round4 } from '../../utils/money.js';
import { newId } from '../../utils/ids.js';
import { validarSucursal } from '../general/general.service.js';
import * as repo from './inventario.repository.js';
import * as productosRepo from '../productos/productos.repository.js';

export const UNIDADES = ['kg', 'lt', 'und'];

/** Clasifica el estado de existencias frente al stock mínimo. */
export const estadoStock = (existencia, minimo) => {
  if (existencia <= 0) return 'agotado';
  if (existencia < minimo) return 'por_agotarse';
  return 'disponible';
};

function aInsumoConEstado(fila) {
  const existencia = round4(fila.existencia);
  return {
    ...fila,
    existencia,
    estado: estadoStock(existencia, fila.stockMinimo),
    valor: round2(existencia * fila.costoUnitario),
  };
}

/** Lista los insumos con su existencia, estado y valor para una sucursal. */
export async function listarInsumos(sucursalId) {
  await validarSucursal(sucursalId);
  const filas = await repo.listarInsumos(sucursalId);
  return filas.map(aInsumoConEstado);
}

export async function obtenerInsumo(id, db) {
  const insumo = await repo.obtenerInsumo(id, db);
  if (!insumo) throw notFound('Insumo');
  return insumo;
}

function validarNumeros({ stockMinimo, costoUnitario }) {
  if (Number(stockMinimo) < 0 || Number(costoUnitario) < 0) {
    throw new AppError('Stock mínimo y costo no pueden ser negativos', 422);
  }
}

export async function crearInsumo(data) {
  const { nombre, unidad, stockMinimo, costoUnitario, proveedorId = null } = data;
  if (!UNIDADES.includes(unidad)) throw new AppError('La unidad debe ser kg, lt o und', 422);
  validarNumeros({ stockMinimo, costoUnitario });
  return withTransaction((client) =>
    repo.crearInsumo(
      {
        id: newId('ins'),
        nombre: String(nombre).trim(),
        unidad,
        stockMinimo: Number(stockMinimo),
        costoUnitario: Number(costoUnitario),
        proveedorId: proveedorId || null,
        arte: 'grano',
      },
      client,
    ),
  );
}

export async function actualizarInsumo(id, data) {
  const insumo = await obtenerInsumo(id);
  const numericos = ['stockMinimo', 'costoUnitario'];
  for (const key of ['nombre', 'unidad', 'stockMinimo', 'costoUnitario', 'proveedorId']) {
    if (data[key] === undefined) continue;
    if (numericos.includes(key) && Number(data[key]) < 0) throw new AppError(`${key} no puede ser negativo`, 422);
    insumo[key] = numericos.includes(key) ? Number(data[key]) : data[key];
  }
  if (!UNIDADES.includes(insumo.unidad)) throw new AppError('La unidad debe ser kg, lt o und', 422);
  return repo.guardarInsumo(insumo);
}

/**
 * Registra una entrada de inventario y recalcula el costo promedio ponderado:
 * (existencia total × costo actual + cantidad × costo nuevo) / (existencia total + cantidad).
 * Si recibe un cliente, trabaja dentro de esa transacción (por ejemplo, la de una compra).
 */
export async function registrarEntrada(
  { insumoId, sucursalId, cantidad, costoUnitario, referencia = 'Entrada manual', motivo = 'entrada' },
  client,
) {
  return usarTransaccion(client, async (db) => {
    await validarSucursal(sucursalId, db);
    const insumo = await repo.bloquearInsumo(insumoId, db);
    if (!insumo) throw notFound('Insumo');
    const qty = Number(cantidad);
    if (!(qty > 0)) throw new AppError('La cantidad de la entrada debe ser mayor que cero', 422);
    const costo = costoUnitario !== undefined && costoUnitario !== '' && costoUnitario !== null ? Number(costoUnitario) : insumo.costoUnitario;
    if (!(costo >= 0)) throw new AppError('El costo unitario no puede ser negativo', 422);

    const existenciaTotal = await repo.existenciaTotal(insumoId, db);
    const nuevoCosto = round4((existenciaTotal * insumo.costoUnitario + qty * costo) / (existenciaTotal + qty));
    await repo.actualizarCosto(insumoId, nuevoCosto, db);
    await repo.sumarExistencia(insumoId, sucursalId, round4(qty), db);
    await repo.registrarMovimiento({ tipo: 'entrada', insumoId, sucursalId, cantidad: round4(qty), referencia, motivo }, db);
    return repo.obtenerInsumo(insumoId, db);
  });
}

/** Costo de producción de un producto según su receta (o su costo de compra si es reventa). */
export function costoProducto(producto, insumos) {
  if (producto.tipo === 'reventa') return round2(producto.costo ?? 0);
  const total = producto.receta.reduce((acc, r) => acc + (insumos.get(r.insumoId)?.costoUnitario ?? 0) * r.cantidad, 0);
  return round2(total);
}

/**
 * Explota los items de una venta en requerimientos de inventario:
 * - productos elaborados → insumos según su receta
 * - productos de reventa → unidades del propio producto
 */
export function calcularRequerimientos(items, productos) {
  const insumos = new Map();
  const reventa = new Map();
  for (const item of items) {
    const prod = productos.get(item.productoId);
    if (!prod) throw notFound(`Producto ${item.productoId}`);
    if (prod.tipo === 'reventa') {
      reventa.set(prod.id, (reventa.get(prod.id) ?? 0) + item.cantidad);
    } else {
      for (const r of prod.receta) {
        insumos.set(r.insumoId, round4((insumos.get(r.insumoId) ?? 0) + r.cantidad * item.cantidad));
      }
    }
  }
  return { insumos, reventa };
}

/**
 * Bloquea y verifica las existencias necesarias dentro de la transacción;
 * lanza 409 con el detalle de faltantes.
 */
export async function validarExistencias(requerimientos, sucursalId, db) {
  const faltantes = [];
  const insumos = await repo.bloquearExistencias([...requerimientos.insumos.keys()], sucursalId, db);
  for (const [insumoId, requerido] of requerimientos.insumos) {
    const ins = insumos.get(insumoId);
    const disponible = ins?.cantidad ?? 0;
    if (disponible < requerido) {
      faltantes.push({ id: insumoId, nombre: ins?.nombre ?? insumoId, requerido, disponible, unidad: ins?.unidad });
    }
  }
  const reventa = await productosRepo.bloquearExistenciasReventa([...requerimientos.reventa.keys()], sucursalId, db);
  for (const [productoId, requerido] of requerimientos.reventa) {
    const prod = reventa.get(productoId);
    const disponible = prod?.cantidad ?? 0;
    if (disponible < requerido) faltantes.push({ id: productoId, nombre: prod?.nombre ?? productoId, requerido, disponible, unidad: 'und' });
  }
  if (faltantes.length > 0) {
    const lista = faltantes.map((f) => f.nombre).join(', ');
    throw new AppError(`Existencias insuficientes para completar la orden: ${lista}`, 409, { faltantes });
  }
}

/** Ordena por id para que todas las transacciones toquen las filas en el mismo orden (evita bloqueos cruzados). */
const porId = (mapa) => [...mapa.entries()].sort(([a], [b]) => a.localeCompare(b));

/** Aplica (signo -1) o revierte (signo +1) el consumo de inventario de una venta. */
export async function aplicarConsumo(requerimientos, sucursalId, referencia, signo, db) {
  const tipo = signo < 0 ? 'consumo' : 'reversion';
  for (const [insumoId, cantidad] of porId(requerimientos.insumos)) {
    await repo.sumarExistencia(insumoId, sucursalId, round4(signo * cantidad), db);
    await repo.registrarMovimiento({ tipo, insumoId, sucursalId, cantidad: round4(signo * cantidad), referencia, motivo: 'venta' }, db);
  }
  for (const [productoId, cantidad] of porId(requerimientos.reventa)) {
    await productosRepo.sumarExistenciaReventa(productoId, sucursalId, signo * cantidad, db);
    await repo.registrarMovimiento({ tipo, productoId, sucursalId, cantidad: signo * cantidad, referencia, motivo: 'venta' }, db);
  }
}

/** Alertas de stock mínimo para insumos y productos de reventa. */
export async function alertasStock(sucursalId) {
  const insumos = await listarInsumos(sucursalId);
  const alertasInsumos = insumos
    .filter((i) => i.estado !== 'disponible')
    .map((i) => ({
      tipo: 'insumo', id: i.id, nombre: i.nombre, existencia: i.existencia, minimo: i.stockMinimo, unidad: i.unidad, estado: i.estado,
    }));
  const reventa = await productosRepo.listarReventa(sucursalId);
  const alertasReventa = reventa
    .filter((p) => p.existencia < p.stockMinimo)
    .map((p) => ({
      tipo: 'reventa', id: p.id, nombre: p.nombre, existencia: p.existencia, minimo: p.stockMinimo, unidad: 'und', estado: estadoStock(p.existencia, p.stockMinimo),
    }));
  return [...alertasInsumos, ...alertasReventa];
}

/** Resumen para las tarjetas del módulo de inventario. */
export async function resumenInventario(sucursalId) {
  const insumos = await listarInsumos(sucursalId);
  const reventa = await productosRepo.listarReventa(sucursalId);
  const valorReventa = reventa.reduce((a, p) => a + p.existencia * p.costo, 0);
  const alertas = await alertasStock(sucursalId);
  return {
    totalInsumos: insumos.length,
    porAgotarse: alertas.length,
    enStock: insumos.filter((i) => i.estado === 'disponible').length,
    valorInventario: round2(insumos.reduce((a, i) => a + i.valor, 0) + valorReventa),
  };
}

export const listarMovimientos = (sucursalId, limite = 50) => repo.listarMovimientos(sucursalId, limite);
