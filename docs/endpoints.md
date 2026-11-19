# Endpoints de la API

Base: `/api` (en desarrollo `http://localhost:3000/api`). Todo se envía y se recibe en JSON. Los errores siempre tienen la forma `{ "error": "mensaje" }`, sin detalles internos ni errores de la base de datos.

Las convenciones generales (códigos HTTP, autenticación, filtros, paginación, versión de los registros, IVA y bitácora) están en la [guía de la API](guia-tecnica/api-rest.md). La [colección de Postman](postman/origenes-sv.postman_collection.json) prueba los casos principales.

**Roles:** *Público* = sin sesión · *Con sesión* = cualquier usuario con token · *Todos* = admin, gerente, cajero y barista · *Caja* = admin, gerente y cajero · *Gestión* = admin y gerente · *Admin* = solo admin.

**Sucursal:** quien no es admin solo trabaja con su sucursal. Si la petición nombra otra (`?sucursalId=` o en el cuerpo), o el recurso es de otra sucursal, la respuesta es 403. Las rutas marcadas con ⓢ exigen `?sucursalId=` (400 si falta).

**Códigos que pueden salir en cualquier ruta con sesión:** 401 (sin token, token inválido o vencido, usuario desactivado), 403 (rol o sucursal), 429 (demasiadas peticiones) y 500 (error interno, mensaje genérico).

## Autenticación

| Método | Ruta | Rol | Cuerpo o parámetros | Respuestas |
|---|---|---|---|---|
| POST | `/api/auth/login` | Público | `{ email, password }` | 200 `{ token, expira, usuario }` · 400 faltan datos · 401 credenciales incorrectas · 429 más de 10 intentos fallidos en 15 min |
| GET | `/api/auth/me` | Con sesión | — | 200 usuario de la sesión (id, nombre, email, rol, sucursal) |

## General

| Método | Ruta | Rol | Cuerpo o parámetros | Respuestas |
|---|---|---|---|---|
| GET | `/api/salud` | Público | — | 200 API y base de datos bien · 503 la base no responde |
| GET | `/api/configuracion` | Público | — | 200 nombre, eslogan, logo, colores, fuentes y componentes |
| GET | `/api/configuracion/fuentes` | Público | — | 200 lista de tipografías |
| PUT | `/api/configuracion` | Admin | `{ nombre, eslogan, logo (PNG/JPG base64 ≤ 2 MB o null), colores, fuentes, componentes }` (todo opcional) | 200 configuración · 413 logo muy grande · 422 dato inválido |
| GET | `/api/sucursales` | Todos | — | 200 sucursales |
| GET | `/api/clientes` | Todos | `?q=&activo=true\|false\|todos` | 200 clientes · 400 filtro inválido |
| GET | `/api/clientes/:id` | Todos | — | 200 cliente · 404 |
| POST | `/api/clientes` | Todos | `{ nombre, tipo: consumidor_final\|contribuyente, nit, nrc, giro, direccion, telefono }` | 201 cliente · 400 falta el nombre · 422 contribuyente sin NIT, NRC o giro, o NIT mal escrito |
| PUT | `/api/clientes/:id` | Gestión | Los mismos campos, todos opcionales, y `activo` | 200 cliente · 404 · 409 desactivar "Consumidor final" · 422 |
| DELETE | `/api/clientes/:id` | Gestión | — | 200 cliente desactivado · 404 · 409 "Consumidor final" |
| POST | `/api/sistema/reiniciar` | Admin | — | 200 datos de demo cargados · 403 en producción |

## Tablero

| Método | Ruta | Rol | Cuerpo o parámetros | Respuestas |
|---|---|---|---|---|
| GET | `/api/dashboard` | Todos ⓢ | `?sucursalId=` | 200 ventas del día, órdenes, ticket promedio, cajas, ventas por hora y por sucursal, alertas |
| GET | `/api/notificaciones` | Todos ⓢ | `?sucursalId=` | 200 insumos por agotarse y pagos próximos a vencer |
| GET | `/api/buscar` | Todos | `?q=` (2 letras o más) | 200 resultados: solo de pantallas del rol y de su sucursal |

## Ventas (POS)

| Método | Ruta | Rol | Cuerpo o parámetros | Respuestas |
|---|---|---|---|---|
| GET | `/api/ventas` | Caja | `?sucursalId=&desde=&hasta=&fecha=&tipoComprobante=FCF\|CCF&estado=emitida\|anulada&pagina=&porPagina=` | 200 `{ datos, total, pagina, porPagina, paginas }` · 400 filtro inválido |
| GET | `/api/ventas/:id` | Todos (de su sucursal) | — | 200 comprobante con cliente, sucursal, caja y `atendio` · 404 |
| POST | `/api/ventas` | Todos (caja de su sucursal) | `{ cajaId, items: [{ productoId, cantidad }], tipoComprobante, clienteId, tipoOrden, metodoPago, montoRecibido, referenciaPago }` | 201 comprobante · 400 faltan `cajaId` o `items` · 404 caja o cliente · 409 caja cerrada o existencias insuficientes · 422 CCF sin cliente contribuyente, cliente desactivado, cantidades o pago inválidos |
| PATCH | `/api/ventas/:id/anular` | Gestión (de su sucursal) | `{ motivo }` | 200 venta anulada (devuelve los insumos) · 404 · 409 ya anulada o turno cerrado |

## Productos y recetas

| Método | Ruta | Rol | Cuerpo o parámetros | Respuestas |
|---|---|---|---|---|
| GET | `/api/categorias` | Todos | — | 200 categorías del menú |
| GET | `/api/productos` | Todos | `?sucursalId=&categoriaId=&q=&activo=` | 200 productos con precio sin IVA, costo, margen, receta y unidades disponibles |
| GET | `/api/productos/:id` | Todos | `?sucursalId=` | 200 producto · 404 |
| POST | `/api/productos` | Gestión | `{ nombre, precio (con IVA), categoriaId, tipo: elaborado\|reventa, descripcion, receta: [{ insumoId, cantidad }], costo, stockMinimo, imagen }` | 201 producto · 400 faltan campos · 413 foto mayor de 1 MB · 422 receta vacía o datos inválidos |
| PUT | `/api/productos/:id` | Gestión | Los mismos campos, opcionales, y `version`, `activo` | 200 producto · 404 · 409 alguien más lo modificó (versión vieja) · 422 |
| DELETE | `/api/productos/:id` | Gestión | — | 200 producto desactivado · 404 |

## Inventario

| Método | Ruta | Rol | Cuerpo o parámetros | Respuestas |
|---|---|---|---|---|
| GET | `/api/insumos` | Todos ⓢ | `?sucursalId=&activo=` | 200 insumos con existencia, estado, valor y versión |
| POST | `/api/insumos` | Gestión | `{ nombre, unidad: kg\|lt\|und, stockMinimo, costoUnitario, proveedorId }` | 201 insumo · 400 faltan campos · 422 unidad o números inválidos |
| PUT | `/api/insumos/:id` | Gestión | Los mismos campos, opcionales, y `version`, `activo` | 200 insumo · 404 · 409 versión vieja o en uso por una receta (al desactivar) · 422 |
| DELETE | `/api/insumos/:id` | Gestión | — | 200 insumo desactivado · 404 · 409 lo usa la receta de un platillo activo |
| GET | `/api/inventario/resumen` | Todos ⓢ | `?sucursalId=` | 200 totales para las tarjetas de Inventario |
| GET | `/api/inventario/alertas` | Todos ⓢ | `?sucursalId=` | 200 insumos y productos bajo el stock mínimo |
| GET | `/api/inventario/movimientos` | Todos | `?sucursalId=&limite=` (máximo 500) | 200 entradas, consumos y reversiones, de lo más reciente a lo más antiguo |
| POST | `/api/inventario/entradas` | Gestión | `{ sucursalId, cantidad, insumoId, costoUnitario }` o `{ sucursalId, cantidad, productoId }` (reventa) | 201 insumo o producto con su nueva existencia · 400 faltan campos · 404 · 422 cantidad inválida |

## Caja

| Método | Ruta | Rol | Cuerpo o parámetros | Respuestas |
|---|---|---|---|---|
| GET | `/api/cajas` | Todos ⓢ | `?sucursalId=` | 200 cajas con su turno abierto y totales en vivo |
| GET | `/api/cajas/:id/resumen` | Caja (de su sucursal) | — | 200 resumen del turno abierto · 404 · 409 sin turno abierto |
| POST | `/api/cajas/:id/apertura` | Caja (de su sucursal) | `{ montoInicial, denominaciones }` | 201 turno abierto a nombre del usuario · 404 · 409 ya tiene un turno abierto · 422 monto inválido |
| POST | `/api/cajas/:id/cierre` | Caja (de su sucursal) | `{ efectivoContado, observaciones }` | 200 turno cerrado con esperado, contado y diferencia por método · 400 falta `efectivoContado` · 404 · 409 sin turno abierto · 422 |
| GET | `/api/turnos` | Caja ⓢ | `?sucursalId=&dias=` (máximo 90) | 200 historial de turnos |
| GET | `/api/caja/metodos-pago` | Caja ⓢ | `?sucursalId=&fecha=` (hoy por defecto) | 200 ventas del día por efectivo, tarjeta y Bitcoin |

## Compras y proveedores

| Método | Ruta | Rol | Cuerpo o parámetros | Respuestas |
|---|---|---|---|---|
| GET | `/api/proveedores` | Todos | `?activo=` | 200 proveedores |
| GET | `/api/proveedores/:id` | Todos | — | 200 proveedor · 404 |
| POST | `/api/proveedores` | Gestión | `{ nombre, nit, nrc, telefono, correo, contacto, diasCredito }` | 201 proveedor · 400 falta el nombre · 409 nombre repetido |
| PUT | `/api/proveedores/:id` | Gestión | Los mismos campos, opcionales, y `activo` | 200 proveedor · 404 · 409 nombre repetido |
| DELETE | `/api/proveedores/:id` | Gestión | — | 200 proveedor desactivado · 404 |
| GET | `/api/compras` | Gestión | `?tipo=costo\|gasto&proveedorId=&desde=&hasta=&pagina=&porPagina=` | 200 `{ datos, total, pagina, porPagina, paginas }` con `registradoPor` · 400 filtro inválido |
| GET | `/api/compras/resumen` | Gestión | — | 200 compras y gastos del mes, saldo por pagar, vencidas y proveedores |
| POST | `/api/compras` | Gestión | Insumos: `{ numeroFactura, sucursalId, tipo: costo, proveedorId, condicion: contado\|credito, items: [{ insumoId, cantidad, costoUnitario }] }` · Gasto: `{ numeroFactura, sucursalId, tipo: gasto, monto, proveedorNombre, descripcion }` | 201 `{ compra, cuentaPorPagar }` · 400 faltan campos · 404 proveedor · 409 factura repetida · 422 sin insumos, proveedor desactivado o montos inválidos |
| GET | `/api/cuentas-por-pagar` | Gestión | `?estado=pendiente\|vencida\|pagada` | 200 cuentas con su estado |
| PATCH | `/api/cuentas-por-pagar/:id/pagar` | Gestión (de su sucursal) | `{ monto }` (vacío = paga todo el saldo) | 200 cuenta · 404 · 409 ya pagada · 422 monto mayor al saldo |
| GET | `/api/ordenes-compra` | Gestión | `?estado=pendiente\|recibida` | 200 órdenes |
| POST | `/api/ordenes-compra` | Gestión | `{ sucursalId, pedidos: [{ proveedorId, items: [{ insumoId, cantidad }] }] }` | 201 órdenes creadas · 400 faltan campos · 422 sin productos o cantidades inválidas |

## Recursos humanos y planilla

| Método | Ruta | Rol | Cuerpo o parámetros | Respuestas |
|---|---|---|---|---|
| GET | `/api/empleados` | Gestión | `?q=&estado=activo\|inactivo&sucursalId=` | 200 empleados (el gerente, solo los de su sucursal) |
| GET | `/api/empleados/cargos` | Gestión | — | 200 cargos disponibles |
| POST | `/api/empleados` | Gestión | `{ nombre, cargo, salarioMensual, sucursalId, dui, afp, telefono, fechaIngreso }` | 201 empleado (el del gerente queda en su sucursal) · 400 faltan campos · 409 DUI repetido · 422 salario o DUI inválido |
| PUT | `/api/empleados/:id` | Gestión (de su sucursal) | Los mismos campos, opcionales, y `estado` | 200 empleado · 404 · 409 DUI repetido · 422 |
| DELETE | `/api/empleados/:id` | Gestión (de su sucursal) | — | 200 empleado dado de baja (conserva su historial) · 404 |
| GET | `/api/planillas` | Gestión | — | 200 historial (el gerente ve solo las líneas de su sucursal) |
| GET | `/api/planillas/calculo` | Gestión | `?fecha=AAAA-MM-DD` | 200 vista previa de la quincena: ISSS, AFP, renta y líquido por empleado |
| GET | `/api/planillas/:id` | Gestión | — | 200 planilla con su detalle · 404 |
| POST | `/api/planillas` | Admin | `{ fecha }` (opcional: la quincena actual) | 201 planilla generada · 409 esa quincena ya existe · 422 sin empleados activos |
| PATCH | `/api/planillas/:id/pagar` | Admin | — | 200 planilla pagada · 404 · 409 ya pagada |

## Pronóstico

| Método | Ruta | Rol | Cuerpo o parámetros | Respuestas |
|---|---|---|---|---|
| GET | `/api/pronostico` | Gestión ⓢ | `?sucursalId=&dias=` (7 por defecto, máximo 30) | 200 resumen, serie diaria, consumo por insumo, alertas y pedidos sugeridos por proveedor |

## Administración

| Método | Ruta | Rol | Cuerpo o parámetros | Respuestas |
|---|---|---|---|---|
| GET | `/api/usuarios` | Admin | — | 200 usuarios con rol, sucursal y estado (nunca la contraseña) |
| POST | `/api/usuarios` | Admin | `{ nombre, email, password (12 a 72 caracteres), rol, sucursalId, empleadoId }` | 201 usuario · 400 faltan campos · 409 correo repetido · 422 correo, rol, sucursal o contraseña inválidos |
| PUT | `/api/usuarios/:id` | Admin | Los mismos campos, opcionales, y `activo`; `password` vacío no la cambia | 200 usuario · 404 · 409 quitarse a sí mismo el acceso o el rol admin, o dejar el sistema sin admin · 422 |
| DELETE | `/api/usuarios/:id` | Admin | — | 200 usuario desactivado (su sesión deja de servir) · 404 · 409 desactivarse a sí mismo |
| GET | `/api/bitacora` | Admin | `?usuarioId=&entidad=&accion=&desde=&hasta=&pagina=&porPagina=` | 200 `{ datos, total, pagina, porPagina, paginas }` · 400 filtro inválido |
