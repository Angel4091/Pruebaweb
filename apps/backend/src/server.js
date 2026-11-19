import { createApp } from './app.js';
import { config, problemasDeSeguridad } from './config/env.js';
import { probarConexion, cerrarPool, describirError } from './config/database.js';

// Sin una configuración segura (JWT_SECRET, CORS) la API no arranca.
const problemas = problemasDeSeguridad();
if (problemas.length > 0) {
  console.error('❌ La configuración de seguridad está incompleta (apps/backend/.env):');
  for (const p of problemas) console.error(`   • ${p}`);
  process.exit(1);
}

// Antes de aceptar peticiones, confirma que PostgreSQL responde.
try {
  const { base, usuario } = await probarConexion();
  console.log(`🐘 PostgreSQL conectado: base "${base}" con el usuario "${usuario}"`);
} catch (err) {
  console.error('❌ No se pudo conectar a PostgreSQL. Revisa apps/backend/.env y que la base esté levantada (npm run db:up).');
  console.error(`   Detalle: ${describirError(err)}`);
  await cerrarPool();
  process.exit(1);
}

const app = createApp();
const servidor = app.listen(config.port, () => {
  console.log(`🌮 API de Orígenes SV escuchando en http://localhost:${config.port}/api`);
});

// Cierre ordenado: deja de aceptar peticiones y libera las conexiones.
for (const senal of ['SIGINT', 'SIGTERM']) {
  process.on(senal, () => {
    servidor.close(() => cerrarPool().finally(() => process.exit(0)));
  });
}
