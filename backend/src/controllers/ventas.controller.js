import * as ventas from '../services/ventas.service.js';

/** POST /api/ventas — registra una venta del POS. */
export const crear = (req, res) => {
  const venta = ventas.crearVenta(req.body);
  res.status(201).location(`/api/ventas/${venta.id}`).json(venta);
};

/** GET /api/ventas?sucursalId=&fecha=&tipoComprobante=&limite= */
export const listar = (req, res) => {
  res.json(ventas.listarVentas(req.query));
};

/** GET /api/ventas/:id */
export const obtener = (req, res) => {
  res.json(ventas.obtenerVenta(req.params.id));
};

/** PATCH /api/ventas/:id/anular */
export const anular = (req, res) => {
  res.json(ventas.anularVenta(req.params.id, req.body?.motivo));
};
