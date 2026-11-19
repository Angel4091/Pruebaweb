import * as rrhh from './rrhh.service.js';

export const listarEmpleados = async (req, res) => res.json(await rrhh.listarEmpleados(req.query));
export const crearEmpleado = async (req, res) => res.status(201).json(await rrhh.crearEmpleado(req.body));
export const actualizarEmpleado = async (req, res) => res.json(await rrhh.actualizarEmpleado(req.params.id, req.body));
export const eliminarEmpleado = async (req, res) => res.json(await rrhh.darDeBajaEmpleado(req.params.id));
export const cargos = (req, res) => res.json(rrhh.CARGOS);

export const listarPlanillas = async (req, res) => res.json(await rrhh.listarPlanillas());
export const obtenerPlanilla = async (req, res) => res.json(await rrhh.obtenerPlanilla(req.params.id));
export const calcularPlanilla = async (req, res) => res.json(await rrhh.calcularPlanilla(req.query.fecha));
export const generarPlanilla = async (req, res) => res.status(201).json(await rrhh.generarPlanilla(req.body?.fecha));
export const pagarPlanilla = async (req, res) => res.json(await rrhh.pagarPlanilla(req.params.id));
