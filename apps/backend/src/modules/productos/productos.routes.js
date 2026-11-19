import { Router } from 'express';
import { requireFields } from '../../middlewares/validate.js';
import * as prod from './productos.controller.js';

const router = Router();

router.get('/categorias', prod.listarCategorias);
router.get('/productos', prod.listarProductos);
router.get('/productos/:id', prod.obtenerProducto);
router.post('/productos', requireFields(['nombre', 'precio', 'categoriaId']), prod.crearProducto);
router.put('/productos/:id', prod.actualizarProducto);
router.delete('/productos/:id', prod.eliminarProducto);

export default router;
