import { Router } from 'express';
import { autenticar } from '../middlewares/auth.js';
import { limitarASuSucursal } from '../middlewares/roles.js';
import auth from '../modules/auth/auth.routes.js';
import general, { rutasPublicas } from '../modules/general/general.routes.js';
import usuarios from '../modules/usuarios/usuarios.routes.js';
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
 *
 * Seguridad (D-04): solo /salud, la configuración visual y el inicio de sesión
 * son públicos. Todo lo demás exige un JWT válido; cada ruta indica qué roles
 * pueden usarla y, si la petición nombra una sucursal, debe ser la del usuario
 * (el admin trabaja con todas).
 */
const router = Router();

router.use(rutasPublicas);
router.use(auth);

router.use(autenticar, limitarASuSucursal);
for (const modulo of [general, usuarios, tablero, ventas, productos, inventario, caja, compras, rrhh, pronostico]) {
  router.use(modulo);
}

export default router;
