import { leerActivo } from '../../utils/filtros.js';
import * as general from './general.service.js';

export const sucursales = async (req, res) => res.json(await general.listarSucursales());

export const listarClientes = async (req, res) =>
  res.json(await general.listarClientes({ q: req.query.q, activo: leerActivo(req.query.activo) }));
export const obtenerCliente = async (req, res) => res.json(await general.obtenerCliente(req.params.id));
export const crearCliente = async (req, res) => res.status(201).json(await general.crearCliente(req.body));
export const actualizarCliente = async (req, res) => res.json(await general.actualizarCliente(req.params.id, req.body));
export const desactivarCliente = async (req, res) => res.json(await general.desactivarCliente(req.params.id));

export const obtenerConfiguracion = async (req, res) => res.json(await general.obtenerConfiguracion());
export const actualizarConfiguracion = async (req, res) => res.json(await general.actualizarConfiguracion(req.body));
export const fuentes = (req, res) => res.json(general.FUENTES);

/** POST /api/sistema/reiniciar — vuelve a cargar los datos de demostración. */
export const reiniciar = async (req, res) => {
  await general.reiniciarDatos();
  res.json({ mensaje: 'Datos de demostración restablecidos' });
};

/** GET /api/salud — responde 503 si la base de datos no contesta. */
export const salud = async (req, res) => {
  const estado = await general.salud();
  res.status(estado.baseDeDatos === 'ok' ? 200 : 503).json(estado);
};
