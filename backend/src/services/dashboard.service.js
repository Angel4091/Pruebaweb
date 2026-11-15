import { db } from '../config/db.js';
import { round2 } from '../utils/money.js';
import { toDateKey, addDays } from '../utils/dates.js';
import { validarSucursal, alertasStock } from './inventario.service.js';
import { listarCajas } from './caja.service.js';

const ventasDelDia = (sucursalId, fecha) =>
  db.collection('ventas').filter((v) => v.estado === 'emitida' && v.sucursalId === sucursalId && toDateKey(v.fecha) === fecha);

const variacion = (actual, anterior) => (anterior > 0 ? round2(((actual - anterior) / anterior) * 100) : 0);

/** Datos del tablero de inicio para una sucursal. */
export function obtenerDashboard(sucursalId) {
  validarSucursal(sucursalId);
  const hoy = toDateKey();
  const ayer = toDateKey(addDays(new Date(), -1));
  const horaActual = new Date().getHours();
  const ventasHoy = ventasDelDia(sucursalId, hoy);
  // Comparación justa: ventas de ayer hasta la misma hora.
  const ventasAyer = ventasDelDia(sucursalId, ayer).filter((v) => new Date(v.fecha).getHours() <= horaActual);

  const totalHoy = round2(ventasHoy.reduce((a, v) => a + v.total, 0));
  const totalAyer = round2(ventasAyer.reduce((a, v) => a + v.total, 0));
  const ticketHoy = ventasHoy.length ? round2(totalHoy / ventasHoy.length) : 0;
  const ticketAyer = ventasAyer.length ? round2(totalAyer / ventasAyer.length) : 0;

  const ventasPorHora = Array.from({ length: 13 }, (_, i) => 9 + i).map((hora) => ({
    hora,
    total: round2(ventasHoy.filter((v) => new Date(v.fecha).getHours() === hora).reduce((a, v) => a + v.total, 0)),
  }));

  const conteo = new Map();
  for (const v of ventasHoy) {
    for (const it of v.items) conteo.set(it.productoId, (conteo.get(it.productoId) ?? 0) + it.cantidad);
  }
  const productos = db.collection('productos');
  const masVendidos = [...conteo.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([id, cantidad]) => {
      const p = productos.find((x) => x.id === id);
      return { id, nombre: p?.nombre, arte: p?.arte, cantidad };
    });

  const sucursales = db.collection('sucursales');
  const totalesSucursal = sucursales.map((s) => ({
    id: s.id,
    nombre: s.nombre,
    total: round2(ventasDelDia(s.id, hoy).reduce((a, v) => a + v.total, 0)),
  }));
  const granTotal = totalesSucursal.reduce((a, s) => a + s.total, 0);

  const cajas = listarCajas(sucursalId);

  return {
    fecha: hoy,
    kpis: {
      ventas: { valor: totalHoy, variacion: variacion(totalHoy, totalAyer) },
      ordenes: { valor: ventasHoy.length, variacion: variacion(ventasHoy.length, ventasAyer.length) },
      ticketPromedio: { valor: ticketHoy, variacion: variacion(ticketHoy, ticketAyer) },
      cajasAbiertas: { valor: cajas.filter((c) => c.estado === 'abierta').length, total: cajas.length },
    },
    ventasPorHora,
    masVendidos,
    ventasPorSucursal: totalesSucursal.map((s) => ({ ...s, porcentaje: granTotal > 0 ? Math.round((s.total / granTotal) * 100) : 0 })),
    cajas: cajas.map((c) => ({ id: c.id, nombre: c.nombre, estado: c.estado })),
    alertas: alertasStock(sucursalId),
  };
}

/** Notificaciones para la campana: stock bajo y cuentas por pagar vencidas o próximas. */
export function obtenerNotificaciones(sucursalId) {
  const stock = alertasStock(sucursalId).map((a) => ({
    id: `stock-${a.id}`,
    tipo: 'stock',
    titulo: `${a.nombre} ${a.estado === 'agotado' ? 'agotado' : 'por agotarse'}`,
    detalle: `Quedan ${a.existencia} ${a.unidad} (mínimo ${a.minimo})`,
    ruta: '/inventario',
  }));
  const limite = addDays(new Date(), 5).toISOString();
  const cuentas = db
    .collection('cuentasPorPagar')
    .filter((c) => c.saldo > 0 && c.fechaVencimiento <= limite)
    .map((c) => ({
      id: `cxp-${c.id}`,
      tipo: 'pago',
      titulo: `Pago a ${c.proveedorNombre}`,
      detalle: `$${c.saldo.toFixed(2)} vence el ${toDateKey(c.fechaVencimiento)}`,
      ruta: '/compras',
    }));
  return [...stock, ...cuentas];
}

/** Búsqueda global (barra superior). */
export function buscar(q) {
  const texto = String(q ?? '').toLowerCase().trim();
  if (texto.length < 2) return [];
  const match = (s) => s?.toLowerCase().includes(texto);
  return [
    ...db.collection('productos').filter((p) => p.activo && match(p.nombre)).map((p) => ({ tipo: 'Producto', id: p.id, nombre: p.nombre, ruta: '/pos' })),
    ...db.collection('insumos').filter((i) => match(i.nombre)).map((i) => ({ tipo: 'Insumo', id: i.id, nombre: i.nombre, ruta: '/inventario' })),
    ...db.collection('empleados').filter((e) => match(e.nombre) || match(e.cargo)).map((e) => ({ tipo: 'Empleado', id: e.id, nombre: `${e.nombre} · ${e.cargo}`, ruta: '/personal' })),
    ...db.collection('proveedores').filter((p) => match(p.nombre)).map((p) => ({ tipo: 'Proveedor', id: p.id, nombre: p.nombre, ruta: '/compras' })),
    ...db.collection('ventas').filter((v) => match(v.numero)).slice(-5).map((v) => ({ tipo: 'Comprobante', id: v.id, nombre: v.numero, ruta: '/pos' })),
  ].slice(0, 12);
}
