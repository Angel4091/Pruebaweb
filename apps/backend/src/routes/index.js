import { Router } from 'express';
import general from '../modules/general/general.routes.js';
import tablero from '../modules/tablero/tablero.routes.js';
import ventas from '../modules/ventas/ventas.routes.js';
import productos from '../modules/productos/productos.routes.js';
import inventario from '../modules/inventario/inventario.routes.js';
import caja from '../modules/caja/caja.routes.js';
import compras from '../modules/compras/compras.routes.js';
import rrhh from '../modules/rrhh/rrhh.routes.js';
import pronostico from '../modules/pronostico/pronostico.routes.js';

/**
 * Rutas REST de la API (todas bajo /api). Cada módulo define las suyas en
 * src/modules/<modulo>/<modulo>.routes.js. Convención:
 *   GET    /recurso          → listar
 *   GET    /recurso/:id      → obtener
 *   POST   /recurso          → crear (201)
 *   PUT    /recurso/:id      → actualizar
 *   PATCH  /recurso/:id/...  → acción sobre el recurso
 *   DELETE /recurso/:id      → eliminar / dar de baja
 */
const router = Router();

for (const modulo of [general, tablero, ventas, productos, inventario, caja, compras, rrhh, pronostico]) {
  router.use(modulo);
}

export default router;
