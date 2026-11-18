// npm run db:init — crea las tablas e índices de database/schema.sql.
// Se puede correr varias veces: solo crea lo que falta.
import { probarConexion, aplicarEsquema, cerrarPool } from '../src/config/database.js';

try {
  const { base } = await probarConexion();
  await aplicarEsquema();
  console.log(`✅ Esquema aplicado en la base "${base}".`);
} catch (err) {
  console.error('❌ No se pudo aplicar el esquema:', err.message);
  console.error('   ¿Está levantado PostgreSQL? Prueba con: npm run db:up');
  process.exitCode = 1;
} finally {
  await cerrarPool();
}
