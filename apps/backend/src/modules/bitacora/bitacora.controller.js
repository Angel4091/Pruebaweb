import * as bitacora from './bitacora.service.js';

/** GET /api/bitacora?usuarioId=&entidad=&accion=&desde=&hasta=&pagina=&porPagina= */
export const listar = async (req, res) => res.json(await bitacora.listarBitacora(req.query));
