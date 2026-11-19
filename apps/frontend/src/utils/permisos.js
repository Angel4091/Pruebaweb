/**
 * Qué puede ver y hacer cada rol (D-04 y D-28). Es el mismo criterio de la API:
 * aquí solo sirve para mostrar u ocultar pantallas y botones; quien decide de
 * verdad es el backend, que responde 403 si alguien intenta saltárselo.
 */
const TODOS = ['admin', 'gerente', 'cajero', 'barista'];
const GESTION = ['admin', 'gerente'];
const CAJA = ['admin', 'gerente', 'cajero'];
const SOLO_ADMIN = ['admin'];

/** Pantallas del menú y los roles que las usan. */
const PANTALLAS = {
  '/': TODOS,
  '/pos': TODOS,
  '/inventario': TODOS,
  '/compras': GESTION,
  '/caja': CAJA,
  '/personal': GESTION,
  '/pronostico': GESTION,
  '/identidad': SOLO_ADMIN,
  '/administracion': SOLO_ADMIN,
};

/** Acciones dentro de una pantalla que no todos los roles pueden hacer. */
const ACCIONES = {
  cambiarSucursal: SOLO_ADMIN,
  editarInventario: GESTION, // insumos, platillos y entradas
  gestionarPlanilla: SOLO_ADMIN, // generar y pagar
};

export const NOMBRE_ROL = { admin: 'Administrador', gerente: 'Gerente', cajero: 'Cajero', barista: 'Barista' };

export const puedeVer = (usuario, ruta) => Boolean(usuario) && (PANTALLAS[ruta] ?? TODOS).includes(usuario.rol);

export const puede = (usuario, accion) => Boolean(usuario) && (ACCIONES[accion] ?? []).includes(usuario.rol);
