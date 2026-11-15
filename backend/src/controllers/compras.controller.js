import * as compras from '../services/compras.service.js';

export const listarProveedores = (req, res) => res.json(compras.listarProveedores());
export const crearProveedor = (req, res) => res.status(201).json(compras.crearProveedor(req.body));
export const actualizarProveedor = (req, res) => res.json(compras.actualizarProveedor(req.params.id, req.body));

export const listarCompras = (req, res) => res.json(compras.listarCompras(req.query));
export const crearCompra = (req, res) => res.status(201).json(compras.crearCompra(req.body));
export const resumen = (req, res) => res.json(compras.resumenCompras());

export const listarCuentas = (req, res) => res.json(compras.listarCuentasPorPagar(req.query));
export const pagarCuenta = (req, res) => res.json(compras.pagarCuenta(req.params.id, req.body));

export const listarOrdenes = (req, res) => res.json(compras.listarOrdenesCompra(req.query));
export const crearOrdenes = (req, res) => res.status(201).json(compras.crearOrdenesCompra(req.body));
