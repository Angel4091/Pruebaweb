import * as pedidos from '../services/pedidos.service.js';

/** GET /api/pedidos?sucursalId=&activos=true&origen=&porCobrar=true — cocina y caja. */
export const listar = (req, res) => res.json(pedidos.listarPedidos(req.query));

/** GET /api/pedidos/mios — pedidos del cliente de la sesión. */
export const mios = (req, res) => res.json(pedidos.listarMisPedidos(req.usuario));

/** POST /api/pedidos — pedido en línea de un cliente. */
export const crear = (req, res) => res.status(201).json(pedidos.crearPedidoEnLinea(req.usuario, req.body));

/** PATCH /api/pedidos/:id/estado — avanza o cancela un pedido. */
export const cambiarEstado = (req, res) => res.json(pedidos.cambiarEstado(req.params.id, req.body?.estado, req.usuario));
