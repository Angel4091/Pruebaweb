import { db } from '../config/db.js';
import { AppError, notFound } from '../utils/AppError.js';
import { round2, IVA_RATE } from '../utils/money.js';
import { newId } from '../utils/ids.js';
import { addDays } from '../utils/dates.js';
import { registrarEntrada, obtenerInsumo, validarSucursal } from './inventario.service.js';

/* ---------- Proveedores ---------- */

export const listarProveedores = () => db.collection('proveedores');

export function crearProveedor(data) {
  const { nombre, nit = '', nrc = '', telefono = '', correo = '', contacto = '', diasCredito = 0 } = data;
  if (db.collection('proveedores').some((p) => p.nombre.toLowerCase() === String(nombre).trim().toLowerCase())) {
    throw new AppError('Ya existe un proveedor con ese nombre', 409);
  }
  const proveedor = { id: newId('prov'), nombre: String(nombre).trim(), nit, nrc, telefono, correo, contacto, diasCredito: Number(diasCredito) || 0 };
  db.collection('proveedores').push(proveedor);
  db.save();
  return proveedor;
}

export function actualizarProveedor(id, data) {
  const prov = db.collection('proveedores').find((p) => p.id === id);
  if (!prov) throw notFound('Proveedor');
  for (const key of ['nombre', 'nit', 'nrc', 'telefono', 'correo', 'contacto', 'diasCredito']) {
    if (data[key] !== undefined) prov[key] = key === 'diasCredito' ? Number(data[key]) : data[key];
  }
  db.save();
  return prov;
}

/* ---------- Compras (costos y gastos) ---------- */

/** Estado de una cuenta por pagar según su saldo y fecha de vencimiento. */
const estadoCuenta = (cxp) => {
  if (cxp.saldo <= 0) return 'pagada';
  return new Date(cxp.fechaVencimiento) < new Date() ? 'vencida' : 'pendiente';
};

/**
 * Registra una factura de compra.
 * - tipo "costo": compra de insumos → entra al inventario y actualiza el costo promedio.
 * - tipo "gasto": servicios u otros gastos (luz, alquiler) → no afecta inventario.
 * Si la condición es "credito", se crea una cuenta por pagar.
 */
export function crearCompra(data) {
  const {
    numeroFactura, proveedorId = null, proveedorNombre = '', sucursalId, tipo = 'costo', condicion = 'contado', descripcion = '', items = [], monto, ordenCompraId = null,
  } = data;
  validarSucursal(sucursalId);
  if (!['costo', 'gasto'].includes(tipo)) throw new AppError('El tipo debe ser costo o gasto', 422);
  if (!['contado', 'credito'].includes(condicion)) throw new AppError('La condición debe ser contado o crédito', 422);
  if (db.collection('compras').some((c) => c.numeroFactura === numeroFactura && c.proveedorId === proveedorId)) {
    throw new AppError('Esa factura ya fue registrada para este proveedor', 409);
  }
  const proveedor = proveedorId ? db.collection('proveedores').find((p) => p.id === proveedorId) : null;
  if (proveedorId && !proveedor) throw notFound('Proveedor');
  if (tipo === 'costo' && !proveedor) throw new AppError('Las compras de insumos requieren un proveedor', 422);

  let lineas = [];
  let subtotal;
  if (tipo === 'costo') {
    if (!Array.isArray(items) || items.length === 0) throw new AppError('Agrega al menos un insumo a la factura', 422);
    lineas = items.map((it) => {
      const ins = obtenerInsumo(it.insumoId);
      const cantidad = Number(it.cantidad);
      const costoUnitario = Number(it.costoUnitario);
      if (!(cantidad > 0) || !(costoUnitario >= 0)) throw new AppError(`Cantidad o costo inválido para ${ins.nombre}`, 422);
      return { insumoId: ins.id, nombre: ins.nombre, cantidad, costoUnitario, total: round2(cantidad * costoUnitario) };
    });
    subtotal = round2(lineas.reduce((a, l) => a + l.total, 0));
  } else {
    subtotal = round2(monto);
    if (!(subtotal > 0)) throw new AppError('El monto del gasto debe ser mayor que cero', 422);
  }
  const iva = round2(subtotal * IVA_RATE);
  db.data.correlativoCompras = (db.data.correlativoCompras ?? 0) + 1;
  const compra = {
    id: `com-${String(db.data.correlativoCompras).padStart(4, '0')}`,
    numeroFactura: String(numeroFactura).trim(),
    proveedorId,
    proveedorNombre: proveedor?.nombre ?? proveedorNombre,
    sucursalId,
    tipo,
    descripcion: descripcion || (tipo === 'costo' ? 'Compra de insumos' : 'Gasto operativo'),
    fecha: new Date().toISOString(),
    items: lineas,
    subtotal,
    iva,
    total: round2(subtotal + iva),
    condicion,
    ordenCompraId,
  };

  for (const l of lineas) {
    registrarEntrada(
      { insumoId: l.insumoId, sucursalId, cantidad: l.cantidad, costoUnitario: l.costoUnitario, referencia: compra.numeroFactura, motivo: 'compra' },
      { persist: false },
    );
  }

  db.collection('compras').push(compra);
  let cuenta = null;
  if (condicion === 'credito') {
    const dias = proveedor?.diasCredito || 30;
    cuenta = {
      id: newId('cxp'),
      compraId: compra.id,
      proveedorId,
      proveedorNombre: compra.proveedorNombre,
      numeroFactura: compra.numeroFactura,
      monto: compra.total,
      saldo: compra.total,
      fechaVencimiento: addDays(new Date(), dias).toISOString(),
      estado: 'pendiente',
      pagos: [],
    };
    db.collection('cuentasPorPagar').push(cuenta);
  }
  if (ordenCompraId) {
    const orden = db.collection('ordenesCompra').find((o) => o.id === ordenCompraId);
    if (orden) {
      orden.estado = 'recibida';
      orden.compraId = compra.id;
    }
  }
  db.save();
  return { compra, cuentaPorPagar: cuenta };
}

export function listarCompras({ sucursalId, tipo } = {}) {
  return db
    .collection('compras')
    .filter((c) => !sucursalId || c.sucursalId === sucursalId)
    .filter((c) => !tipo || c.tipo === tipo)
    .slice()
    .reverse();
}

export function listarCuentasPorPagar({ estado } = {}) {
  return db
    .collection('cuentasPorPagar')
    .map((c) => ({ ...c, estado: estadoCuenta(c) }))
    .filter((c) => !estado || c.estado === estado)
    .sort((a, b) => a.fechaVencimiento.localeCompare(b.fechaVencimiento));
}

/** Abono o pago total de una cuenta por pagar. */
export function pagarCuenta(id, { monto } = {}) {
  const cxp = db.collection('cuentasPorPagar').find((c) => c.id === id);
  if (!cxp) throw notFound('Cuenta por pagar');
  if (cxp.saldo <= 0) throw new AppError('La cuenta ya está pagada', 409);
  const abono = monto === undefined || monto === '' ? cxp.saldo : round2(monto);
  if (!(abono > 0)) throw new AppError('El monto del pago debe ser mayor que cero', 422);
  if (abono > cxp.saldo) throw new AppError(`El pago excede el saldo pendiente ($${cxp.saldo.toFixed(2)})`, 422);
  cxp.pagos.push({ fecha: new Date().toISOString(), monto: abono });
  cxp.saldo = round2(cxp.saldo - abono);
  cxp.estado = estadoCuenta(cxp);
  db.save();
  return { ...cxp, estado: estadoCuenta(cxp) };
}

export function resumenCompras() {
  const ahora = new Date();
  const mes = `${ahora.getFullYear()}-${String(ahora.getMonth() + 1).padStart(2, '0')}`;
  const delMes = db.collection('compras').filter((c) => c.fecha.startsWith(mes));
  const cuentas = listarCuentasPorPagar();
  return {
    comprasMes: round2(delMes.filter((c) => c.tipo === 'costo').reduce((a, c) => a + c.total, 0)),
    gastosMes: round2(delMes.filter((c) => c.tipo === 'gasto').reduce((a, c) => a + c.total, 0)),
    porPagar: round2(cuentas.reduce((a, c) => a + c.saldo, 0)),
    vencidas: cuentas.filter((c) => c.estado === 'vencida').length,
    proveedores: db.collection('proveedores').length,
  };
}

/* ---------- Órdenes de compra (generadas desde el pronóstico) ---------- */

export function crearOrdenesCompra({ sucursalId, pedidos }) {
  validarSucursal(sucursalId);
  if (!Array.isArray(pedidos) || pedidos.length === 0) throw new AppError('No hay productos para pedir', 422);
  const ordenes = pedidos.map((p) => {
    const items = p.items.map((it) => {
      const ins = obtenerInsumo(it.insumoId);
      return { insumoId: ins.id, nombre: ins.nombre, unidad: ins.unidad, cantidad: Number(it.cantidad), costoEstimado: round2(ins.costoUnitario * it.cantidad) };
    });
    const proveedor = db.collection('proveedores').find((pr) => pr.id === p.proveedorId);
    return {
      id: newId('oc'),
      proveedorId: p.proveedorId,
      proveedorNombre: proveedor?.nombre ?? 'Sin proveedor',
      sucursalId,
      fecha: new Date().toISOString(),
      items,
      total: round2(items.reduce((a, i) => a + i.costoEstimado, 0)),
      estado: 'pendiente',
    };
  });
  db.collection('ordenesCompra').push(...ordenes);
  db.save();
  return ordenes;
}

export const listarOrdenesCompra = ({ estado } = {}) =>
  db.collection('ordenesCompra').filter((o) => !estado || o.estado === estado).slice().reverse();
