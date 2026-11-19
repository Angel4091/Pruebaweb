import * as general from './general.service.js';

export const sucursales = async (req, res) => res.json(await general.listarSucursales());

export const listarClientes = async (req, res) => res.json(await general.listarClientes(req.query.q));
export const crearCliente = async (req, res) => res.status(201).json(await general.crearCliente(req.body));

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
