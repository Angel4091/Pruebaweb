import * as inventario from '../services/inventario.service.js';
import * as productos from '../services/productos.service.js';

/* Insumos */
export const listarInsumos = (req, res) => res.json(inventario.listarInsumos(req.query.sucursalId));
export const crearInsumo = (req, res) => res.status(201).json(inventario.crearInsumo(req.body));
export const actualizarInsumo = (req, res) => res.json(inventario.actualizarInsumo(req.params.id, req.body));
export const resumen = (req, res) => res.json(inventario.resumenInventario(req.query.sucursalId));
export const alertas = (req, res) => res.json(inventario.alertasStock(req.query.sucursalId));
export const movimientos = (req, res) => res.json(inventario.listarMovimientos(req.query.sucursalId, Number(req.query.limite) || 50));

/** POST /api/inventario/entradas — entrada de insumo o de producto de reventa. */
export const registrarEntrada = (req, res) => {
  const { productoId } = req.body;
  const resultado = productoId ? productos.entradaReventa(req.body) : inventario.registrarEntrada(req.body);
  res.status(201).json(resultado);
};

/* Productos y recetas */
export const listarProductos = (req, res) => res.json(productos.listarProductos({ ...req.query, incluirInactivos: req.query.incluirInactivos === 'true' }));
export const obtenerProducto = (req, res) => res.json(productos.obtenerProducto(req.params.id, req.query.sucursalId));
export const crearProducto = (req, res) => res.status(201).json(productos.crearProducto(req.body));
export const actualizarProducto = (req, res) => res.json(productos.actualizarProducto(req.params.id, req.body));
export const eliminarProducto = (req, res) => res.json(productos.desactivarProducto(req.params.id));
export const listarCategorias = (req, res) => res.json(productos.listarCategorias());
