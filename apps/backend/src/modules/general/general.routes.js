import { Router } from 'express';
import { requireFields } from '../../middlewares/validate.js';
import { permitir, TODOS, SOLO_ADMIN } from '../../middlewares/roles.js';
import { esProduccion } from '../../config/env.js';
import { AppError } from '../../utils/AppError.js';
import * as gen from './general.controller.js';

/**
 * Rutas que no piden sesión: el estado de la API y la identidad visual
 * (la pantalla de inicio de sesión necesita el logo, el nombre y los colores).
 */
export const rutasPublicas = Router();
rutasPublicas.get('/salud', gen.salud);
rutasPublicas.get('/configuracion', gen.obtenerConfiguracion);
rutasPublicas.get('/configuracion/fuentes', gen.fuentes);

/** Restablecer los datos de demo nunca está disponible en producción. */
const soloFueraDeProduccion = (req, res, next) => {
  if (esProduccion) throw new AppError('No disponible en producción', 403);
  next();
};

const router = Router();

router.post('/sistema/reiniciar', permitir(SOLO_ADMIN), soloFueraDeProduccion, gen.reiniciar);

router.get('/sucursales', permitir(TODOS), gen.sucursales);

// En el POS cualquier rol busca clientes y registra uno nuevo para emitir un CCF.
router.get('/clientes', permitir(TODOS), gen.listarClientes);
router.post('/clientes', permitir(TODOS), requireFields(['nombre']), gen.crearCliente);

router.put('/configuracion', permitir(SOLO_ADMIN), gen.actualizarConfiguracion);

export default router;
