import * as rrhh from '../services/rrhh.service.js';

export const listarEmpleados = (req, res) => res.json(rrhh.listarEmpleados(req.query));
export const crearEmpleado = (req, res) => res.status(201).json(rrhh.crearEmpleado(req.body));
export const actualizarEmpleado = (req, res) => res.json(rrhh.actualizarEmpleado(req.params.id, req.body));
export const eliminarEmpleado = (req, res) => res.json(rrhh.darDeBajaEmpleado(req.params.id));
export const cargos = (req, res) => res.json(rrhh.CARGOS);

export const listarPlanillas = (req, res) => res.json(rrhh.listarPlanillas());
export const obtenerPlanilla = (req, res) => res.json(rrhh.obtenerPlanilla(req.params.id));
export const calcularPlanilla = (req, res) => res.json(rrhh.calcularPlanilla(req.query.fecha));
export const generarPlanilla = (req, res) => res.status(201).json(rrhh.generarPlanilla(req.body?.fecha));
export const pagarPlanilla = (req, res) => res.json(rrhh.pagarPlanilla(req.params.id));
