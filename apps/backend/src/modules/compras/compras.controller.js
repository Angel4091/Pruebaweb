import { sucursalDe } from '../../middlewares/roles.js';
import * as compras from './compras.service.js';

export const listarProveedores = async (req, res) => res.json(await compras.listarProveedores());
export const crearProveedor = async (req, res) => res.status(201).json(await compras.crearProveedor(req.body));
export const actualizarProveedor = async (req, res) => res.json(await compras.actualizarProveedor(req.params.id, req.body));

export const listarCompras = async (req, res) =>
  res.json(await compras.listarCompras({ tipo: req.query.tipo, sucursalId: sucursalDe(req) }));
export const crearCompra = async (req, res) => res.status(201).json(await compras.crearCompra(req.body));
export const resumen = async (req, res) => res.json(await compras.resumenCompras({ sucursalId: sucursalDe(req) }));

export const listarCuentas = async (req, res) =>
  res.json(await compras.listarCuentasPorPagar({ estado: req.query.estado, sucursalId: sucursalDe(req) }));
export const pagarCuenta = async (req, res) => res.json(await compras.pagarCuenta(req.params.id, req.body));

export const listarOrdenes = async (req, res) =>
  res.json(await compras.listarOrdenesCompra({ estado: req.query.estado, sucursalId: sucursalDe(req) }));
export const crearOrdenes = async (req, res) => res.status(201).json(await compras.crearOrdenesCompra(req.body));
