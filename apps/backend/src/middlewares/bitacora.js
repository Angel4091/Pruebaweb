import { registrar, resumirDatos } from '../modules/bitacora/bitacora.service.js';

const ACCION_POR_METODO = { POST: 'crear', PUT: 'actualizar', PATCH: 'actualizar', DELETE: 'desactivar' };
const CAMBIA_DATOS = new Set(Object.keys(ACCION_POR_METODO));

/**
 * Qué se hizo y sobre qué, a partir de la ruta que atendió la petición:
 *   POST   /productos             → crear      · productos
 *   PUT    /insumos/:id           → actualizar · insumos
 *   DELETE /clientes/:id          → desactivar · clientes
 *   POST   /cajas/:id/apertura    → apertura   · cajas      (la última parte de la ruta es la acción)
 *   PATCH  /ventas/:id/anular     → anular     · ventas
 *   POST   /inventario/entradas   → entradas   · inventario
 */
function describir(req) {
  const partes = (req.route?.path ?? req.path).split('/').filter(Boolean);
  const [entidad, ...resto] = partes;
  const ultima = resto.at(-1);
  const accion = ultima && !ultima.startsWith(':') ? ultima : ACCION_POR_METODO[req.method];
  return { entidad, accion };
}

/** Id del registro afectado: el de la ruta (/insumos/:id) o el del registro que se acaba de crear. */
const idAfectado = (req, cuerpo) => req.params?.id ?? cuerpo?.id ?? cuerpo?.compra?.id ?? (Array.isArray(cuerpo) ? cuerpo[0]?.id : undefined);

/**
 * Bitácora de auditoría (BE-032): cada cambio que termina bien (POST, PUT, PATCH o DELETE con
 * respuesta 2xx) queda registrado con el usuario, la acción, el módulo, el registro y un resumen
 * de los datos enviados (sin contraseñas ni imágenes).
 * Se guarda justo antes de enviar la respuesta: cuando el usuario ve "listo", el cambio ya está en la bitácora.
 */
export function registrarCambios(req, res, next) {
  if (!CAMBIA_DATOS.has(req.method)) return next();
  const enviarJson = res.json.bind(res);
  res.json = (cuerpo) => {
    if (res.statusCode >= 400 || !req.usuario) return enviarJson(cuerpo);
    const { entidad, accion } = describir(req);
    const entidadId = idAfectado(req, cuerpo);
    registrar({
      usuarioId: req.usuario.id,
      accion,
      entidad,
      entidadId: entidadId === undefined ? null : String(entidadId),
      detalle: {
        ruta: `${req.method} ${req.originalUrl.split('?')[0]}`,
        referencia: cuerpo?.numero ?? cuerpo?.nombre ?? cuerpo?.compra?.numeroFactura ?? null,
        datos: resumirDatos(req.body ?? null),
      },
    }).finally(() => enviarJson(cuerpo));
    return res;
  };
  next();
}
