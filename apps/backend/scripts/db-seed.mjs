// npm run db:seed — borra los datos y carga los de demostración en una sola transacción.
// Necesita SEED_PASSWORD (12 caracteres o más) en apps/backend/.env.
import { probarConexion, withTransaction, cerrarPool, describirError } from '../src/config/database.js';
import { cargarDatosDemo, USUARIOS_DEMO } from '../src/config/datos-demo.js';

try {
  const { base } = await probarConexion();
  const total = await withTransaction((client) => cargarDatosDemo(client));
  console.log(`🌱 Datos de demo cargados en "${base}": ${total.productos} productos, ${total.insumos} insumos, ${total.ventas} ventas.`);
  console.log(`   Usuarios de prueba (contraseña: SEED_PASSWORD): ${USUARIOS_DEMO.map((u) => u.email).join(', ')}`);
} catch (err) {
  console.error('❌ No se pudieron cargar los datos de demo:', describirError(err));
  if (err.code === 'ECONNREFUSED') console.error('   ¿Está levantado PostgreSQL? Prueba con: npm run db:up');
  if (err.code === '42P01') console.error('   Faltan las tablas. Corre primero: npm run db:init');
  process.exitCode = 1;
} finally {
  await cerrarPool();
}
