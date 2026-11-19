import * as productos from './productos.service.js';

export const listarProductos = async (req, res) =>
  res.json(await productos.listarProductos({ ...req.query, incluirInactivos: req.query.incluirInactivos === 'true' }));
export const obtenerProducto = async (req, res) => res.json(await productos.obtenerProducto(req.params.id, req.query.sucursalId));
export const crearProducto = async (req, res) => res.status(201).json(await productos.crearProducto(req.body));
export const actualizarProducto = async (req, res) => res.json(await productos.actualizarProducto(req.params.id, req.body));
export const eliminarProducto = async (req, res) => res.json(await productos.desactivarProducto(req.params.id));
export const listarCategorias = async (req, res) => res.json(await productos.listarCategorias());
