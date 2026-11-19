import { sucursalDe } from '../../middlewares/roles.js';
import * as rrhh from './rrhh.service.js';

/** El gerente registra empleados solo en su sucursal. */
const conSuSucursal = (req) => (req.usuario.rol === 'admin' ? req.body : { ...req.body, sucursalId: req.usuario.sucursalId });

export const listarEmpleados = async (req, res) =>
  res.json(await rrhh.listarEmpleados({ q: req.query.q, estado: req.query.estado, sucursalId: sucursalDe(req) }));
export const crearEmpleado = async (req, res) => res.status(201).json(await rrhh.crearEmpleado(conSuSucursal(req)));
export const actualizarEmpleado = async (req, res) => res.json(await rrhh.actualizarEmpleado(req.params.id, req.body));
export const eliminarEmpleado = async (req, res) => res.json(await rrhh.darDeBajaEmpleado(req.params.id));
export const cargos = (req, res) => res.json(rrhh.CARGOS);

export const listarPlanillas = async (req, res) => res.json(await rrhh.listarPlanillas({ sucursalId: sucursalDe(req) }));
export const obtenerPlanilla = async (req, res) =>
  res.json(await rrhh.obtenerPlanilla(req.params.id, { sucursalId: sucursalDe(req) }));
export const calcularPlanilla = async (req, res) =>
  res.json(await rrhh.calcularPlanilla(req.query.fecha, undefined, sucursalDe(req)));
export const generarPlanilla = async (req, res) => res.status(201).json(await rrhh.generarPlanilla(req.body?.fecha));
export const pagarPlanilla = async (req, res) => res.json(await rrhh.pagarPlanilla(req.params.id));
