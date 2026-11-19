import { round2 } from '../../utils/money.js';
import { toDateKey, addDays, rangoDelDia } from '../../utils/dates.js';
import { validarSucursal } from '../general/general.service.js';
import { alertasStock } from '../inventario/inventario.service.js';
import { listarCajas } from '../caja/caja.service.js';
import * as comprasRepo from '../compras/compras.repository.js';
import * as repo from './tablero.repository.js';

const variacion = (actual, anterior) => (anterior > 0 ? round2(((actual - anterior) / anterior) * 100) : 0);
const sumar = (ventas) => round2(ventas.reduce((a, v) => a + v.total, 0));

/** Datos del tablero de inicio para una sucursal. */
export async function obtenerDashboard(sucursalId) {
  await validarSucursal(sucursalId);
  const ahora = new Date();
  const hoy = toDateKey(ahora);
  const rangoHoy = rangoDelDia(hoy);
  const rangoAyer = rangoDelDia(toDateKey(addDays(ahora, -1)));
  const horaActual = ahora.getHours();

  const [ventasHoy, ventasAyerTodas, masVendidos, totalesSucursal, cajas, alertas] = await Promise.all([
    repo.ventasEnRango(sucursalId, rangoHoy.desde, rangoHoy.hasta),
    repo.ventasEnRango(sucursalId, rangoAyer.desde, rangoAyer.hasta),
    repo.masVendidos(sucursalId, rangoHoy.desde, rangoHoy.hasta, 3),
    repo.totalesPorSucursal(rangoHoy.desde, rangoHoy.hasta),
    listarCajas(sucursalId),
    alertasStock(sucursalId),
  ]);
  // Comparación justa: ventas de ayer hasta la misma hora.
  const ventasAyer = ventasAyerTodas.filter((v) => new Date(v.fecha).getHours() <= horaActual);

  const totalHoy = sumar(ventasHoy);
  const totalAyer = sumar(ventasAyer);
  const ticketHoy = ventasHoy.length ? round2(totalHoy / ventasHoy.length) : 0;
  const ticketAyer = ventasAyer.length ? round2(totalAyer / ventasAyer.length) : 0;

  // Las horas que aún no llegan quedan en null para no dibujarlas como cero.
  const ventasPorHora = Array.from({ length: 13 }, (_, i) => 9 + i).map((hora) => ({
    hora,
    total: hora > horaActual ? null : sumar(ventasHoy.filter((v) => new Date(v.fecha).getHours() === hora)),
  }));

  const granTotal = totalesSucursal.reduce((a, s) => a + s.total, 0);

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
    ventasPorSucursal: totalesSucursal.map((s) => ({ ...s, total: round2(s.total), porcentaje: granTotal > 0 ? Math.round((s.total / granTotal) * 100) : 0 })),
    cajas: cajas.map((c) => ({ id: c.id, nombre: c.nombre, estado: c.estado })),
    alertas,
  };
}

/** Notificaciones para la campana: stock bajo y cuentas por pagar vencidas o próximas. */
export async function obtenerNotificaciones(sucursalId) {
  const [alertas, cuentas] = await Promise.all([alertasStock(sucursalId), comprasRepo.cuentasPorVencer(addDays(new Date(), 5))]);
  const stock = alertas.map((a) => ({
    id: `stock-${a.id}`,
    tipo: 'stock',
    titulo: `${a.nombre} ${a.estado === 'agotado' ? 'agotado' : 'por agotarse'}`,
    detalle: `Quedan ${a.existencia} ${a.unidad} (mínimo ${a.minimo})`,
    ruta: '/inventario',
  }));
  const pagos = cuentas.map((c) => ({
    id: `cxp-${c.id}`,
    tipo: 'pago',
    titulo: `Pago a ${c.proveedorNombre}`,
    detalle: `$${c.saldo.toFixed(2)} vence el ${toDateKey(c.fechaVencimiento)}`,
    ruta: '/compras',
  }));
  return [...stock, ...pagos];
}

/** Búsqueda global (barra superior). */
export async function buscar(q) {
  const texto = String(q ?? '').toLowerCase().trim();
  if (texto.length < 2) return [];
  const [productos, insumos, empleados, proveedores, comprobantes] = await Promise.all([
    repo.buscarProductos(texto),
    repo.buscarInsumos(texto),
    repo.buscarEmpleados(texto),
    repo.buscarProveedores(texto),
    repo.buscarComprobantes(texto),
  ]);
  return [
    ...productos.map((p) => ({ tipo: 'Producto', id: p.id, nombre: p.nombre, ruta: '/pos' })),
    ...insumos.map((i) => ({ tipo: 'Insumo', id: i.id, nombre: i.nombre, ruta: '/inventario' })),
    ...empleados.map((e) => ({ tipo: 'Empleado', id: e.id, nombre: `${e.nombre} · ${e.cargo}`, ruta: '/personal' })),
    ...proveedores.map((p) => ({ tipo: 'Proveedor', id: p.id, nombre: p.nombre, ruta: '/compras' })),
    ...comprobantes.map((v) => ({ tipo: 'Comprobante', id: v.id, nombre: v.numero, ruta: '/pos' })),
  ].slice(0, 12);
}
