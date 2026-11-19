import { withTransaction } from '../../config/database.js';
import { AppError, notFound } from '../../utils/AppError.js';
import { round2, IVA_RATE } from '../../utils/money.js';
import { newId } from '../../utils/ids.js';
import { addDays, rangoDelMes } from '../../utils/dates.js';
import { leerPaginacion, leerRangoFechas, paginado } from '../../utils/filtros.js';
import { registrarEntrada, obtenerInsumo } from '../inventario/inventario.service.js';
import { validarSucursal } from '../general/general.service.js';
import * as repo from './compras.repository.js';

/* ---------- Proveedores ---------- */

export const listarProveedores = ({ activo = true } = {}) => repo.listarProveedores({ activo });

export async function obtenerProveedor(id) {
  const prov = await repo.obtenerProveedor(id);
  if (!prov) throw notFound('Proveedor');
  return prov;
}

export async function crearProveedor(data) {
  const { nombre, nit = '', nrc = '', telefono = '', correo = '', contacto = '', diasCredito = 0 } = data;
  const limpio = String(nombre).trim();
  if (await repo.existeProveedorConNombre(limpio)) throw new AppError('Ya existe un proveedor con ese nombre', 409);
  return repo.crearProveedor({ id: newId('prov'), nombre: limpio, nit, nrc, telefono, correo, contacto, diasCredito: Math.max(0, Number(diasCredito) || 0) });
}

export async function actualizarProveedor(id, data) {
  const prov = await repo.obtenerProveedor(id);
  if (!prov) throw notFound('Proveedor');
  for (const key of ['nombre', 'nit', 'nrc', 'telefono', 'correo', 'contacto', 'diasCredito']) {
    if (data[key] !== undefined) prov[key] = key === 'diasCredito' ? Math.max(0, Number(data[key]) || 0) : data[key];
  }
  if (data.activo !== undefined) prov.activo = Boolean(data.activo);
  prov.nombre = String(prov.nombre).trim();
  if (await repo.existeProveedorConNombre(prov.nombre, id)) throw new AppError('Ya existe un proveedor con ese nombre', 409);
  return repo.guardarProveedor(prov);
}

/** Baja lógica: el proveedor deja de aparecer al registrar compras; sus facturas y cuentas se conservan. */
export const desactivarProveedor = (id) => actualizarProveedor(id, { activo: false });

/* ---------- Compras (costos y gastos) ---------- */

/** Estado de una cuenta por pagar según su saldo y fecha de vencimiento. */
const estadoCuenta = (cxp) => {
  if (cxp.saldo <= 0) return 'pagada';
  return new Date(cxp.fechaVencimiento) < new Date() ? 'vencida' : 'pendiente';
};

const conEstado = (cxp) => (cxp ? { ...cxp, estado: estadoCuenta(cxp) } : null);

/**
 * Registra una factura de compra en una sola transacción.
 * - tipo "costo": compra de insumos → entra al inventario y actualiza el costo promedio.
 * - tipo "gasto": servicios u otros gastos (luz, alquiler) → no afecta inventario.
 * Si la condición es "credito", se crea una cuenta por pagar.
 */
export async function crearCompra(data, usuario = null) {
  const {
    numeroFactura, proveedorId = null, proveedorNombre = '', sucursalId, tipo = 'costo', condicion = 'contado', descripcion = '', items = [], monto, ordenCompraId = null,
  } = data;
  if (!['costo', 'gasto'].includes(tipo)) throw new AppError('El tipo debe ser costo o gasto', 422);
  if (!['contado', 'credito'].includes(condicion)) throw new AppError('La condición debe ser contado o crédito', 422);
  const factura = String(numeroFactura).trim();

  return withTransaction(async (client) => {
    await validarSucursal(sucursalId, client);
    if (await repo.existeFactura(factura, proveedorId || null, client)) {
      throw new AppError('Esa factura ya fue registrada para este proveedor', 409);
    }
    const proveedor = proveedorId ? await repo.obtenerProveedor(proveedorId, client) : null;
    if (proveedorId && !proveedor) throw notFound('Proveedor');
    if (proveedor && !proveedor.activo) throw new AppError(`El proveedor ${proveedor.nombre} está desactivado`, 422);
    if (tipo === 'costo' && !proveedor) throw new AppError('Las compras de insumos requieren un proveedor', 422);

    let lineas = [];
    let subtotal;
    if (tipo === 'costo') {
      if (!Array.isArray(items) || items.length === 0) throw new AppError('Agrega al menos un insumo a la factura', 422);
      lineas = [];
      for (const it of items) {
        const ins = await obtenerInsumo(it.insumoId, client);
        const cantidad = Number(it.cantidad);
        const costoUnitario = Number(it.costoUnitario);
        if (!(cantidad > 0) || !(costoUnitario >= 0)) throw new AppError(`Cantidad o costo inválido para ${ins.nombre}`, 422);
        lineas.push({ insumoId: ins.id, nombre: ins.nombre, cantidad, costoUnitario, total: round2(cantidad * costoUnitario) });
      }
      subtotal = round2(lineas.reduce((a, l) => a + l.total, 0));
    } else {
      subtotal = round2(monto);
      if (!(subtotal > 0)) throw new AppError('El monto del gasto debe ser mayor que cero', 422);
    }
    const iva = round2(subtotal * IVA_RATE);
    const orden = ordenCompraId ? await repo.obtenerOrden(ordenCompraId, client) : null;

    const numero = await repo.siguienteNumeroCompra(client);
    const compra = {
      id: `com-${String(numero).padStart(4, '0')}`,
      numeroFactura: factura,
      proveedorId: proveedor?.id ?? null,
      proveedorNombre: proveedor?.nombre ?? proveedorNombre,
      sucursalId,
      tipo,
      descripcion: descripcion || (tipo === 'costo' ? 'Compra de insumos' : 'Gasto operativo'),
      fecha: new Date(),
      items: lineas,
      subtotal,
      iva,
      total: round2(subtotal + iva),
      condicion,
      ordenCompraId: orden?.id ?? null,
      creadoPor: usuario?.id ?? null, // D-19: quién registró la factura
    };
    await repo.insertarCompra(compra, client);

    // Entradas al inventario en orden de id, igual que las ventas, para no cruzar bloqueos.
    for (const l of [...lineas].sort((a, b) => a.insumoId.localeCompare(b.insumoId))) {
      await registrarEntrada(
        { insumoId: l.insumoId, sucursalId, cantidad: l.cantidad, costoUnitario: l.costoUnitario, referencia: compra.numeroFactura, motivo: 'compra' },
        client,
      );
    }

    let cuentaId = null;
    if (condicion === 'credito') {
      const dias = proveedor?.diasCredito || 30;
      cuentaId = newId('cxp');
      await repo.insertarCuenta({
        id: cuentaId,
        compraId: compra.id,
        proveedorId: compra.proveedorId,
        proveedorNombre: compra.proveedorNombre,
        numeroFactura: compra.numeroFactura,
        monto: compra.total,
        saldo: compra.total,
        fechaVencimiento: addDays(new Date(), dias),
      }, client);
    }
    if (orden) await repo.marcarOrdenRecibida(orden.id, compra.id, client);

    return {
      compra: await repo.obtenerCompra(compra.id, client),
      cuentaPorPagar: cuentaId ? conEstado(await repo.obtenerCuenta(cuentaId, client)) : null,
    };
  });
}

/** Historial de compras paginado en el servidor. Filtros: sucursal, tipo, proveedor y rango de fechas. */
export async function listarCompras({ sucursalId, tipo, proveedorId, desde, hasta, pagina, porPagina } = {}) {
  if (tipo && !['costo', 'gasto'].includes(tipo)) throw new AppError('tipo debe ser costo o gasto', 400);
  const paginacion = leerPaginacion({ pagina, porPagina });
  const { filas, total } = await repo.listarCompras({ sucursalId, tipo, proveedorId, ...leerRangoFechas({ desde, hasta }) }, paginacion);
  return paginado(filas, total, paginacion);
}

export async function listarCuentasPorPagar({ estado, sucursalId } = {}) {
  const cuentas = (await repo.listarCuentas(sucursalId)).map(conEstado);
  return cuentas.filter((c) => !estado || c.estado === estado);
}

export async function sucursalDeCuenta(id) {
  const sucursalId = await repo.sucursalDeCuenta(id);
  if (sucursalId === undefined) throw notFound('Cuenta por pagar');
  return sucursalId;
}

/** Abono o pago total de una cuenta por pagar. */
export async function pagarCuenta(id, { monto } = {}) {
  return withTransaction(async (client) => {
    const cxp = await repo.bloquearCuenta(id, client);
    if (!cxp) throw notFound('Cuenta por pagar');
    if (cxp.saldo <= 0) throw new AppError('La cuenta ya está pagada', 409);
    const abono = monto === undefined || monto === '' || monto === null ? cxp.saldo : round2(monto);
    if (!(abono > 0)) throw new AppError('El monto del pago debe ser mayor que cero', 422);
    if (abono > cxp.saldo) throw new AppError(`El pago excede el saldo pendiente ($${cxp.saldo.toFixed(2)})`, 422);
    await repo.registrarPago(id, abono, round2(cxp.saldo - abono), client);
    return conEstado(await repo.obtenerCuenta(id, client));
  });
}

export async function resumenCompras({ sucursalId } = {}) {
  const { desde, hasta } = rangoDelMes(new Date());
  const [totales, cuentas, proveedores] = await Promise.all([
    repo.totalesPorTipo(desde, hasta, sucursalId),
    listarCuentasPorPagar({ sucursalId }),
    repo.contarProveedores(),
  ]);
  return {
    comprasMes: round2(totales.costos),
    gastosMes: round2(totales.gastos),
    porPagar: round2(cuentas.reduce((a, c) => a + c.saldo, 0)),
    vencidas: cuentas.filter((c) => c.estado === 'vencida').length,
    proveedores,
  };
}

/* ---------- Órdenes de compra (generadas desde el pronóstico) ---------- */

export async function crearOrdenesCompra({ sucursalId, pedidos } = {}) {
  if (!Array.isArray(pedidos) || pedidos.length === 0) throw new AppError('No hay productos para pedir', 422);
  return withTransaction(async (client) => {
    await validarSucursal(sucursalId, client);
    const creadas = [];
    for (const p of pedidos) {
      if (!Array.isArray(p.items) || p.items.length === 0) throw new AppError('Cada pedido necesita al menos un insumo', 422);
      const items = [];
      for (const it of p.items) {
        const ins = await obtenerInsumo(it.insumoId, client);
        const cantidad = Number(it.cantidad);
        if (!(cantidad > 0)) throw new AppError(`Cantidad inválida para ${ins.nombre}`, 422);
        items.push({ insumoId: ins.id, nombre: ins.nombre, unidad: ins.unidad, cantidad, costoEstimado: round2(ins.costoUnitario * cantidad) });
      }
      const proveedor = p.proveedorId ? await repo.obtenerProveedor(p.proveedorId, client) : null;
      const orden = {
        id: newId('oc'),
        proveedorId: proveedor?.id ?? null,
        proveedorNombre: proveedor?.nombre ?? 'Sin proveedor',
        sucursalId,
        fecha: new Date(),
        items,
        total: round2(items.reduce((a, i) => a + i.costoEstimado, 0)),
      };
      await repo.insertarOrden(orden, client);
      creadas.push(await repo.obtenerOrden(orden.id, client));
    }
    return creadas;
  });
}

export const listarOrdenesCompra = ({ estado, sucursalId } = {}) => repo.listarOrdenes(estado, sucursalId);
