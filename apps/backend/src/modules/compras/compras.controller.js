import { sucursalDe } from '../../middlewares/roles.js';
import { leerActivo } from '../../utils/filtros.js';
import * as compras from './compras.service.js';

export const listarProveedores = async (req, res) => res.json(await compras.listarProveedores({ activo: leerActivo(req.query.activo) }));
export const obtenerProveedor = async (req, res) => res.json(await compras.obtenerProveedor(req.params.id));
export const crearProveedor = async (req, res) => res.status(201).json(await compras.crearProveedor(req.body));
export const actualizarProveedor = async (req, res) => res.json(await compras.actualizarProveedor(req.params.id, req.body));
export const desactivarProveedor = async (req, res) => res.json(await compras.desactivarProveedor(req.params.id));

/** GET /api/compras?tipo=&proveedorId=&desde=&hasta=&pagina=&porPagina= → { datos, total, pagina, porPagina, paginas } */
export const listarCompras = async (req, res) => res.json(await compras.listarCompras({ ...req.query, sucursalId: sucursalDe(req) }));
export const crearCompra = async (req, res) => res.status(201).json(await compras.crearCompra(req.body, req.usuario));
export const resumen = async (req, res) => res.json(await compras.resumenCompras({ sucursalId: sucursalDe(req) }));

export const listarCuentas = async (req, res) =>
  res.json(await compras.listarCuentasPorPagar({ estado: req.query.estado, sucursalId: sucursalDe(req) }));
export const pagarCuenta = async (req, res) => res.json(await compras.pagarCuenta(req.params.id, req.body));

export const listarOrdenes = async (req, res) =>
  res.json(await compras.listarOrdenesCompra({ estado: req.query.estado, sucursalId: sucursalDe(req) }));
export const crearOrdenes = async (req, res) => res.status(201).json(await compras.crearOrdenesCompra(req.body));
