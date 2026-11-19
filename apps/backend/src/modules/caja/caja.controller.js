import * as caja from './caja.service.js';

export const listar = async (req, res) => res.json(await caja.listarCajas(req.query.sucursalId));
export const abrir = async (req, res) => res.status(201).json(await caja.abrirCaja(req.params.id, req.body));
export const resumen = async (req, res) => res.json(await caja.resumenCaja(req.params.id));
export const cerrar = async (req, res) => res.json(await caja.cerrarCaja(req.params.id, req.body));
export const historial = async (req, res) =>
  res.json(await caja.historialTurnos(req.query.sucursalId, Math.min(Number(req.query.dias) || 7, 90)));
export const porMetodo = async (req, res) => res.json(await caja.ventasPorMetodo(req.query.sucursalId, req.query.fecha));
