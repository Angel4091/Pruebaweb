import { Router } from 'express';
import { requireFields } from '../../middlewares/validate.js';
import { permitir, SOLO_ADMIN } from '../../middlewares/roles.js';
import { AppError } from '../../utils/AppError.js';
import * as usuarios from './usuarios.controller.js';

const router = Router();

/** El id de usuario es numérico (bigserial). */
const idNumerico = (req, res, next) => {
  if (!/^\d+$/.test(req.params.id)) throw new AppError('Usuario no encontrado', 404);
  next();
};

router.get('/usuarios', permitir(SOLO_ADMIN), usuarios.listar);
router.post('/usuarios', permitir(SOLO_ADMIN), requireFields(['nombre', 'email', 'password', 'rol']), usuarios.crear);
router.put('/usuarios/:id', permitir(SOLO_ADMIN), idNumerico, usuarios.actualizar);
router.delete('/usuarios/:id', permitir(SOLO_ADMIN), idNumerico, usuarios.desactivar);

export default router;
