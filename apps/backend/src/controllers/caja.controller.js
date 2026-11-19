import * as caja from '../services/caja.service.js';

export const listar = (req, res) => res.json(caja.listarCajas(req.query.sucursalId));
export const abrir = (req, res) => res.status(201).json(caja.abrirCaja(req.params.id, req.body));
export const resumen = (req, res) => res.json(caja.resumenCaja(req.params.id));
export const cerrar = (req, res) => res.json(caja.cerrarCaja(req.params.id, req.body));
export const historial = (req, res) => res.json(caja.historialTurnos(req.query.sucursalId, Number(req.query.dias) || 7));
export const porMetodo = (req, res) => res.json(caja.ventasPorMetodo(req.query.sucursalId, req.query.fecha));
