import { createApp } from './app.js';
import { config } from './config/env.js';
import { db } from './config/db.js';

// Carga (o crea desde los seeds) la base de datos antes de aceptar peticiones.
db.data;

const app = createApp();
app.listen(config.port, () => {
  console.log(`🌮 API de Orígenes SV escuchando en http://localhost:${config.port}/api`);
});
