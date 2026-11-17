import * as general from '../services/general.service.js';
import * as dashboard from '../services/dashboard.service.js';
import { calcularPronostico } from '../services/pronostico.service.js';
import { db } from '../config/db.js';

export const sucursales = (req, res) => res.json(general.listarSucursales());

export const listarClientes = (req, res) => res.json(general.listarClientes(req.query.q));
export const crearCliente = (req, res) => res.status(201).json(general.crearCliente(req.body));

export const obtenerConfiguracion = (req, res) => res.json(general.obtenerConfiguracion());
export const actualizarConfiguracion = (req, res) => res.json(general.actualizarConfiguracion(req.body));
export const fuentes = (req, res) => res.json(general.FUENTES);

export const tablero = (req, res) => res.json(dashboard.obtenerDashboard(req.query.sucursalId));
/** Notificaciones según el rol: el administrador ve stock y pagos; cajero y cocina, solo stock. */
export const notificaciones = (req, res) => {
  const todas = dashboard.obtenerNotificaciones(req.query.sucursalId);
  res.json(req.usuario.rol === 'administrador' ? todas : todas.filter((n) => n.tipo === 'stock'));
};

/** Qué resultados de búsqueda puede ver cada rol (según los módulos a los que tiene acceso). */
const BUSQUEDA_POR_ROL = {
  administrador: ['Producto', 'Insumo', 'Empleado', 'Proveedor', 'Comprobante'],
  cajero: ['Producto', 'Comprobante'],
  cocinero: ['Producto', 'Insumo'],
};
export const buscar = (req, res) => {
  const permitidos = BUSQUEDA_POR_ROL[req.usuario.rol] ?? [];
  res.json(dashboard.buscar(req.query.q).filter((r) => permitidos.includes(r.tipo)));
};

export const pronostico = (req, res) => res.json(calcularPronostico(req.query.sucursalId, Number(req.query.dias) || 7));

/** POST /api/sistema/reiniciar — vuelve a cargar los datos semilla (demo). */
export const reiniciar = (req, res) => {
  db.reset();
  res.json({ mensaje: 'Datos de demostración restablecidos' });
};

export const salud = (req, res) => res.json({ estado: 'ok', fecha: new Date().toISOString() });
