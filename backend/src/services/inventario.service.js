import { db } from '../config/db.js';
import { AppError, notFound } from '../utils/AppError.js';
import { round2, round4 } from '../utils/money.js';
import { newId } from '../utils/ids.js';

/** Clasifica el estado de existencias frente al stock mínimo. */
export const estadoStock = (existencia, minimo) => {
  if (existencia <= 0) return 'agotado';
  if (existencia < minimo) return 'por_agotarse';
  return 'disponible';
};

export const validarSucursal = (sucursalId) => {
  if (!db.collection('sucursales').some((s) => s.id === sucursalId)) throw notFound('Sucursal');
};

/** Lista los insumos con su existencia, estado y valor para una sucursal. */
export function listarInsumos(sucursalId) {
  validarSucursal(sucursalId);
  const proveedores = db.collection('proveedores');
  return db.collection('insumos').map((ins) => {
    const existencia = round4(ins.stock[sucursalId] ?? 0);
    return {
      ...ins,
      existencia,
      estado: estadoStock(existencia, ins.stockMinimo),
      valor: round2(existencia * ins.costoUnitario),
      proveedorNombre: proveedores.find((p) => p.id === ins.proveedorId)?.nombre ?? '—',
    };
  });
}

export function obtenerInsumo(id) {
  const ins = db.collection('insumos').find((i) => i.id === id);
  if (!ins) throw notFound('Insumo');
  return ins;
}

export function crearInsumo(data) {
  const { nombre, unidad, stockMinimo, costoUnitario, proveedorId = null } = data;
  if (!['kg', 'lt', 'und'].includes(unidad)) throw new AppError('La unidad debe ser kg, lt o und', 422);
  if (Number(stockMinimo) < 0 || Number(costoUnitario) < 0) {
    throw new AppError('Stock mínimo y costo no pueden ser negativos', 422);
  }
  const stock = Object.fromEntries(db.collection('sucursales').map((s) => [s.id, 0]));
  const insumo = {
    id: newId('ins'),
    nombre: String(nombre).trim(),
    unidad,
    stockMinimo: Number(stockMinimo),
    costoUnitario: Number(costoUnitario),
    proveedorId,
    arte: 'grano',
    stock,
  };
  db.collection('insumos').push(insumo);
  db.save();
  return insumo;
}

export function actualizarInsumo(id, data) {
  const ins = obtenerInsumo(id);
  const numericos = ['stockMinimo', 'costoUnitario'];
  for (const key of ['nombre', 'unidad', 'stockMinimo', 'costoUnitario', 'proveedorId']) {
    if (data[key] === undefined) continue;
    if (numericos.includes(key) && Number(data[key]) < 0) throw new AppError(`${key} no puede ser negativo`, 422);
    ins[key] = numericos.includes(key) ? Number(data[key]) : data[key];
  }
  db.save();
  return ins;
}

/** Registra un movimiento en la bitácora de inventario. */
function registrarMovimiento({ tipo, insumoId = null, productoId = null, sucursalId, cantidad, referencia, motivo }) {
  db.collection('movimientosInventario').push({
    id: newId('mov'),
    fecha: new Date().toISOString(),
    tipo,
    insumoId,
    productoId,
    sucursalId,
    cantidad: round4(cantidad),
    referencia,
    motivo,
  });
}

/** Registra una entrada de inventario y recalcula el costo promedio ponderado. */
export function registrarEntrada(
  { insumoId, sucursalId, cantidad, costoUnitario, referencia = 'Entrada manual', motivo = 'entrada' },
  { persist = true } = {},
) {
  validarSucursal(sucursalId);
  const ins = obtenerInsumo(insumoId);
  const qty = Number(cantidad);
  if (!(qty > 0)) throw new AppError('La cantidad de la entrada debe ser mayor que cero', 422);
  const existenciaTotal = Object.values(ins.stock).reduce((a, b) => a + Math.max(b, 0), 0);
  const costo = costoUnitario !== undefined && costoUnitario !== '' ? Number(costoUnitario) : ins.costoUnitario;
  ins.costoUnitario = round4((existenciaTotal * ins.costoUnitario + qty * costo) / (existenciaTotal + qty));
  ins.stock[sucursalId] = round4((ins.stock[sucursalId] ?? 0) + qty);
  registrarMovimiento({ tipo: 'entrada', insumoId, sucursalId, cantidad: qty, referencia, motivo });
  if (persist) db.save();
  return ins;
}

/** Costo de producción de un producto según su receta (o su costo de compra si es reventa). */
export function costoProducto(producto) {
  if (producto.tipo === 'reventa') return round2(producto.costo ?? 0);
  const insumos = db.collection('insumos');
  const total = producto.receta.reduce((acc, r) => {
    const ins = insumos.find((i) => i.id === r.insumoId);
    return acc + (ins ? ins.costoUnitario * r.cantidad : 0);
  }, 0);
  return round2(total);
}

/**
 * Explota los items de una venta en requerimientos de inventario:
 * - productos elaborados → insumos según su receta
 * - productos de reventa → unidades del propio producto
 */
export function calcularRequerimientos(items) {
  const productos = db.collection('productos');
  const insumos = new Map();
  const reventa = new Map();
  for (const item of items) {
    const prod = productos.find((p) => p.id === item.productoId);
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

/** Verifica que haya existencias suficientes; lanza 409 con el detalle de faltantes. */
export function validarExistencias(requerimientos, sucursalId) {
  const faltantes = [];
  const insumos = db.collection('insumos');
  const productos = db.collection('productos');
  for (const [insumoId, requerido] of requerimientos.insumos) {
    const ins = insumos.find((i) => i.id === insumoId);
    const disponible = ins?.stock[sucursalId] ?? 0;
    if (disponible < requerido) {
      faltantes.push({ id: insumoId, nombre: ins?.nombre ?? insumoId, requerido, disponible, unidad: ins?.unidad });
    }
  }
  for (const [productoId, requerido] of requerimientos.reventa) {
    const prod = productos.find((p) => p.id === productoId);
    const disponible = prod?.stock?.[sucursalId] ?? 0;
    if (disponible < requerido) faltantes.push({ id: productoId, nombre: prod.nombre, requerido, disponible, unidad: 'und' });
  }
  if (faltantes.length > 0) {
    const lista = faltantes.map((f) => f.nombre).join(', ');
    throw new AppError(`Existencias insuficientes para completar la orden: ${lista}`, 409, { faltantes });
  }
}

/** Aplica (signo -1) o revierte (signo +1) el consumo de inventario de una venta. */
export function aplicarConsumo(requerimientos, sucursalId, referencia, signo = -1) {
  const insumos = db.collection('insumos');
  const productos = db.collection('productos');
  const tipo = signo < 0 ? 'consumo' : 'reversion';
  for (const [insumoId, cantidad] of requerimientos.insumos) {
    const ins = insumos.find((i) => i.id === insumoId);
    ins.stock[sucursalId] = round4((ins.stock[sucursalId] ?? 0) + signo * cantidad);
    registrarMovimiento({ tipo, insumoId, sucursalId, cantidad: signo * cantidad, referencia, motivo: 'venta' });
  }
  for (const [productoId, cantidad] of requerimientos.reventa) {
    const prod = productos.find((p) => p.id === productoId);
    prod.stock[sucursalId] = (prod.stock[sucursalId] ?? 0) + signo * cantidad;
    registrarMovimiento({ tipo, productoId, sucursalId, cantidad: signo * cantidad, referencia, motivo: 'venta' });
  }
}

/** Alertas de stock mínimo para insumos y productos de reventa. */
export function alertasStock(sucursalId) {
  const alertasInsumos = listarInsumos(sucursalId)
    .filter((i) => i.estado !== 'disponible')
    .map((i) => ({
      tipo: 'insumo', id: i.id, nombre: i.nombre, existencia: i.existencia, minimo: i.stockMinimo, unidad: i.unidad, estado: i.estado,
    }));
  const alertasReventa = db
    .collection('productos')
    .filter((p) => p.tipo === 'reventa' && p.activo)
    .map((p) => ({ p, existencia: p.stock[sucursalId] ?? 0 }))
    .filter(({ p, existencia }) => existencia < p.stockMinimo)
    .map(({ p, existencia }) => ({
      tipo: 'reventa', id: p.id, nombre: p.nombre, existencia, minimo: p.stockMinimo, unidad: 'und', estado: estadoStock(existencia, p.stockMinimo),
    }));
  return [...alertasInsumos, ...alertasReventa];
}

/** Resumen para las tarjetas del módulo de inventario. */
export function resumenInventario(sucursalId) {
  const insumos = listarInsumos(sucursalId);
  const reventa = db.collection('productos').filter((p) => p.tipo === 'reventa');
  const valorReventa = reventa.reduce((a, p) => a + (p.stock[sucursalId] ?? 0) * (p.costo ?? 0), 0);
  const alertas = alertasStock(sucursalId);
  return {
    totalInsumos: insumos.length,
    porAgotarse: alertas.length,
    enStock: insumos.filter((i) => i.estado === 'disponible').length,
    valorInventario: round2(insumos.reduce((a, i) => a + i.valor, 0) + valorReventa),
  };
}

export function listarMovimientos(sucursalId, limite = 50) {
  return db
    .collection('movimientosInventario')
    .filter((m) => !sucursalId || m.sucursalId === sucursalId)
    .slice(-limite)
    .reverse();
}
