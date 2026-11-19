import { Router } from 'express';
import { requireFields } from '../../middlewares/validate.js';
import * as rrhh from './rrhh.controller.js';

const router = Router();

router.get('/empleados', rrhh.listarEmpleados);
router.get('/empleados/cargos', rrhh.cargos);
router.post('/empleados', requireFields(['nombre', 'cargo', 'salarioMensual']), rrhh.crearEmpleado);
router.put('/empleados/:id', rrhh.actualizarEmpleado);
router.delete('/empleados/:id', rrhh.eliminarEmpleado);

router.get('/planillas', rrhh.listarPlanillas);
router.get('/planillas/calculo', rrhh.calcularPlanilla);
router.get('/planillas/:id', rrhh.obtenerPlanilla);
router.post('/planillas', rrhh.generarPlanilla);
router.patch('/planillas/:id/pagar', rrhh.pagarPlanilla);

export default router;
