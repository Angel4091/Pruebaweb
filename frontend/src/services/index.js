import { api } from './api.js';

/** Servicios por módulo: cada función devuelve una promesa con la respuesta de la API. */

export const generalService = {
  sucursales: () => api.get('/sucursales'),
  dashboard: (sucursalId) => api.get('/dashboard', { sucursalId }),
  notificaciones: (sucursalId) => api.get('/notificaciones', { sucursalId }),
  buscar: (q) => api.get('/buscar', { q }),
  configuracion: () => api.get('/configuracion'),
  guardarConfiguracion: (data) => api.put('/configuracion', data),
  fuentes: () => api.get('/configuracion/fuentes'),
  reiniciar: () => api.post('/sistema/reiniciar'),
};

export const clientesService = {
  listar: (q) => api.get('/clientes', { q }),
  crear: (data) => api.post('/clientes', data),
};

export const productosService = {
  listar: (params) => api.get('/productos', params),
  obtener: (id, sucursalId) => api.get(`/productos/${id}`, { sucursalId }),
  crear: (data) => api.post('/productos', data),
  actualizar: (id, data) => api.put(`/productos/${id}`, data),
  eliminar: (id) => api.del(`/productos/${id}`),
  categorias: () => api.get('/categorias'),
};

export const inventarioService = {
  insumos: (sucursalId) => api.get('/insumos', { sucursalId }),
  crearInsumo: (data) => api.post('/insumos', data),
  actualizarInsumo: (id, data) => api.put(`/insumos/${id}`, data),
  resumen: (sucursalId) => api.get('/inventario/resumen', { sucursalId }),
  alertas: (sucursalId) => api.get('/inventario/alertas', { sucursalId }),
  movimientos: (sucursalId) => api.get('/inventario/movimientos', { sucursalId, limite: 30 }),
  registrarEntrada: (data) => api.post('/inventario/entradas', data),
};

export const ventasService = {
  crear: (data) => api.post('/ventas', data),
  listar: (params) => api.get('/ventas', params),
  obtener: (id) => api.get(`/ventas/${id}`),
  anular: (id, motivo) => api.patch(`/ventas/${id}/anular`, { motivo }),
};

export const cajaService = {
  listar: (sucursalId) => api.get('/cajas', { sucursalId }),
  abrir: (cajaId, data) => api.post(`/cajas/${cajaId}/apertura`, data),
  cerrar: (cajaId, data) => api.post(`/cajas/${cajaId}/cierre`, data),
  resumen: (cajaId) => api.get(`/cajas/${cajaId}/resumen`),
  historial: (sucursalId, dias) => api.get('/turnos', { sucursalId, dias }),
  porMetodo: (sucursalId) => api.get('/caja/metodos-pago', { sucursalId }),
};

export const comprasService = {
  proveedores: () => api.get('/proveedores'),
  crearProveedor: (data) => api.post('/proveedores', data),
  listar: (params) => api.get('/compras', params),
  crear: (data) => api.post('/compras', data),
  resumen: () => api.get('/compras/resumen'),
  cuentas: () => api.get('/cuentas-por-pagar'),
  pagar: (id, monto) => api.patch(`/cuentas-por-pagar/${id}/pagar`, { monto }),
  ordenes: (estado) => api.get('/ordenes-compra', { estado }),
  crearOrdenes: (data) => api.post('/ordenes-compra', data),
};

export const rrhhService = {
  empleados: (params) => api.get('/empleados', params),
  cargos: () => api.get('/empleados/cargos'),
  crear: (data) => api.post('/empleados', data),
  actualizar: (id, data) => api.put(`/empleados/${id}`, data),
  baja: (id) => api.del(`/empleados/${id}`),
  planillas: () => api.get('/planillas'),
  calcular: (fecha) => api.get('/planillas/calculo', { fecha }),
  generar: (fecha) => api.post('/planillas', { fecha }),
  pagar: (id) => api.patch(`/planillas/${id}/pagar`),
};

export const pronosticoService = {
  obtener: (sucursalId, dias) => api.get('/pronostico', { sucursalId, dias }),
};
