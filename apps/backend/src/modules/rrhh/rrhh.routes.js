import { Router } from 'express';
import { requireFields } from '../../middlewares/validate.js';
import { permitir, deSuSucursal, GESTION, SOLO_ADMIN } from '../../middlewares/roles.js';
import { sucursalDeEmpleado } from './rrhh.service.js';
import * as rrhh from './rrhh.controller.js';

const router = Router();

// El gerente administra al personal de su sucursal; generar y pagar la planilla es del admin (D-28).
const empleadoPropio = deSuSucursal((req) => sucursalDeEmpleado(req.params.id));

router.get('/empleados', permitir(GESTION), rrhh.listarEmpleados);
router.get('/empleados/cargos', permitir(GESTION), rrhh.cargos);
router.post('/empleados', permitir(GESTION), requireFields(['nombre', 'cargo', 'salarioMensual']), rrhh.crearEmpleado);
router.put('/empleados/:id', permitir(GESTION), empleadoPropio, rrhh.actualizarEmpleado);
router.delete('/empleados/:id', permitir(GESTION), empleadoPropio, rrhh.eliminarEmpleado);

router.get('/planillas', permitir(GESTION), rrhh.listarPlanillas);
router.get('/planillas/calculo', permitir(GESTION), rrhh.calcularPlanilla);
router.get('/planillas/:id', permitir(GESTION), rrhh.obtenerPlanilla);
router.post('/planillas', permitir(SOLO_ADMIN), rrhh.generarPlanilla);
router.patch('/planillas/:id/pagar', permitir(SOLO_ADMIN), rrhh.pagarPlanilla);

export default router;
