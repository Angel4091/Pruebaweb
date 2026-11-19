import { Router } from 'express';
import { requireFields } from '../../middlewares/validate.js';
import { permitir, TODOS, GESTION } from '../../middlewares/roles.js';
import * as prod from './productos.controller.js';

const router = Router();

// Todos ven el menú (lo usa el POS); solo admin y gerente lo modifican.
router.get('/categorias', permitir(TODOS), prod.listarCategorias);
router.get('/productos', permitir(TODOS), prod.listarProductos);
router.get('/productos/:id', permitir(TODOS), prod.obtenerProducto);
router.post('/productos', permitir(GESTION), requireFields(['nombre', 'precio', 'categoriaId']), prod.crearProducto);
router.put('/productos/:id', permitir(GESTION), prod.actualizarProducto);
router.delete('/productos/:id', permitir(GESTION), prod.eliminarProducto);

export default router;
