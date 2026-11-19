import * as inventario from './inventario.service.js';
import * as productos from '../productos/productos.service.js';

export const listarInsumos = async (req, res) => res.json(await inventario.listarInsumos(req.query.sucursalId));
export const crearInsumo = async (req, res) => res.status(201).json(await inventario.crearInsumo(req.body));
export const actualizarInsumo = async (req, res) => res.json(await inventario.actualizarInsumo(req.params.id, req.body));
export const resumen = async (req, res) => res.json(await inventario.resumenInventario(req.query.sucursalId));
export const alertas = async (req, res) => res.json(await inventario.alertasStock(req.query.sucursalId));
export const movimientos = async (req, res) =>
  res.json(await inventario.listarMovimientos(req.query.sucursalId, Math.min(Number(req.query.limite) || 50, 500)));

/** POST /api/inventario/entradas — entrada de insumo o de producto de reventa. */
export const registrarEntrada = async (req, res) => {
  const resultado = req.body.productoId ? await productos.entradaReventa(req.body) : await inventario.registrarEntrada(req.body);
  res.status(201).json(resultado);
};
