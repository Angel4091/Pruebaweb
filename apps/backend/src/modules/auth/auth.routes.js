import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { autenticar } from '../../middlewares/auth.js';
import * as auth from './auth.controller.js';

const router = Router();

// Freno contra ataques de fuerza bruta: 10 intentos fallidos cada 15 minutos por dirección IP.
const limiteLogin = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  skipSuccessfulRequests: true,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { error: 'Demasiados intentos de inicio de sesión. Espera unos minutos.' },
});

router.post('/auth/login', limiteLogin, auth.login);
router.get('/auth/me', autenticar, auth.yo);

export default router;
