import { sucursalDe } from '../../middlewares/roles.js';
import * as ventas from './ventas.service.js';

/** POST /api/ventas — registra una venta del POS a nombre del usuario que la cobra. */
export const crear = async (req, res) => {
  const venta = await ventas.crearVenta(req.body, req.usuario);
  res.status(201).location(`/api/ventas/${venta.id}`).json(venta);
};

/** GET /api/ventas?sucursalId=&fecha=&tipoComprobante=&limite= (fuera del admin, siempre su sucursal) */
export const listar = async (req, res) => res.json(await ventas.listarVentas({ ...req.query, sucursalId: sucursalDe(req) }));

/** GET /api/ventas/:id */
export const obtener = async (req, res) => res.json(await ventas.obtenerVenta(req.params.id));

/** PATCH /api/ventas/:id/anular */
export const anular = async (req, res) => res.json(await ventas.anularVenta(req.params.id, req.body?.motivo));
