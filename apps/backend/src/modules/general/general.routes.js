import { Router } from 'express';
import { requireFields } from '../../middlewares/validate.js';
import * as gen from './general.controller.js';

const router = Router();

router.get('/salud', gen.salud);
router.post('/sistema/reiniciar', gen.reiniciar);

router.get('/sucursales', gen.sucursales);

router.get('/clientes', gen.listarClientes);
router.post('/clientes', requireFields(['nombre']), gen.crearCliente);

router.get('/configuracion', gen.obtenerConfiguracion);
router.put('/configuracion', gen.actualizarConfiguracion);
router.get('/configuracion/fuentes', gen.fuentes);

export default router;
