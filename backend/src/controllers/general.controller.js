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
export const notificaciones = (req, res) => res.json(dashboard.obtenerNotificaciones(req.query.sucursalId));
export const buscar = (req, res) => res.json(dashboard.buscar(req.query.q));

export const pronostico = (req, res) => res.json(calcularPronostico(req.query.sucursalId, Number(req.query.dias) || 7));

/** POST /api/sistema/reiniciar — vuelve a cargar los datos semilla (demo). */
export const reiniciar = (req, res) => {
  db.reset();
  res.json({ mensaje: 'Datos de demostración restablecidos' });
};

export const salud = (req, res) => res.json({ estado: 'ok', fecha: new Date().toISOString() });
