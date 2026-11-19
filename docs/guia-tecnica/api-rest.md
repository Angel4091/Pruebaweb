# Guía de la API REST

Base: `http://localhost:3000/api` · Formato: JSON · Errores: `{ "error": "mensaje", "details": {...} }`

| Código | Uso |
|---|---|
| 200 | Consulta o actualización correcta |
| 201 | Recurso creado (POST) |
| 400 | Falta un campo o parámetro, un filtro no es válido o el JSON está mal formado |
| 401 | Sin sesión, token inválido o vencido, o credenciales incorrectas |
| 403 | El rol no tiene permiso o la sucursal no es la del usuario |
| 404 | Recurso o ruta inexistente |
| 409 | Conflicto de negocio (caja cerrada, stock insuficiente, planilla duplicada, registro repetido) o alguien más modificó el registro (versión vieja) |
| 413 | Petición o imagen demasiado grande |
| 422 | Datos inválidos (validaciones o reglas de la base de datos) |
| 429 | Demasiadas peticiones (300 por minuto; 10 intentos fallidos de login cada 15 minutos) |
| 500 | Error interno (sin detalles de la base de datos) |
| 503 | La base de datos no responde (`/salud`) |

## Autenticación

Solo `/salud`, `GET /configuracion`, `/configuracion/fuentes` y `POST /auth/login` son públicas. Las demás rutas piden el encabezado `Authorization: Bearer <token>`.

| Método | Ruta | Descripción |
|---|---|---|
| POST | `/auth/login` | `{ email, password }` → `{ token, expira, usuario }` |
| GET | `/auth/me` | Usuario de la sesión: id, nombre, correo, rol y sucursal |

- El token es un JWT firmado con HS256 que dura 8 horas (`JWT_EXPIRES_IN`); lleva el id del usuario en `sub`, su rol y su sucursal, con emisor `origenes-sv-api` y audiencia `origenes-sv-web`.
- En cada petición se vuelve a leer el usuario de la base: si el admin lo desactiva, su sesión deja de servir de inmediato.
- Los usuarios que no son admin solo trabajan con su sucursal: si piden otra (`?sucursalId=` o en el cuerpo) la respuesta es 403, y los listados sin sucursal devuelven solo la suya.

### Quién puede usar cada ruta

| Módulo | admin | gerente | cajero | barista |
|---|---|---|---|---|
| Inicio, notificaciones y búsqueda | sí | sí | sí | sí |
| Ventas: registrar y ver un comprobante | sí | sí | sí | sí |
| Ventas: historial | sí | sí | sí | no |
| Ventas: anular | sí | sí | no | no |
| Menú, insumos, existencias y proveedores (consultar) | sí | sí | sí | sí |
| Menú, insumos y entradas de inventario (modificar) | sí | sí | no | no |
| Caja: apertura, cierre, turnos y métodos de pago | sí | sí | sí | no |
| Compras, cuentas por pagar y órdenes | sí | sí | no | no |
| Empleados y planilla (consultar) | sí | su sucursal | no | no |
| Planilla: generar y pagar | sí | no | no | no |
| Pronóstico | sí | sí | no | no |
| Clientes: consultar y crear | sí | sí | sí | sí |
| Clientes: editar y desactivar | sí | sí | no | no |
| Configuración (modificar), usuarios, bitácora y reinicio de datos | sí | no | no | no |

## Filtros y paginación

| Parámetro | Dónde | Valores |
|---|---|---|
| `?activo=` | productos, insumos, clientes, proveedores | `true` (por defecto, solo activos), `false` (solo desactivados) o `todos` |
| `?desde=&hasta=` | ventas, compras, bitácora | fechas `AAAA-MM-DD`; ambos días incluidos |
| `?pagina=&porPagina=` | ventas, compras, bitácora | página desde 1; 20 por página por defecto y 100 como máximo |

Los listados paginados responden:

```json
{ "datos": [ … ], "total": 1370, "pagina": 2, "porPagina": 20, "paginas": 69 }
```

Un valor que no tiene sentido (`?pagina=0`, `?activo=quizas`, `desde` posterior a `hasta`) responde 400.

## Versión de los registros (D-19)

Productos e insumos traen `version`. Al editar, envía la versión que tenías en pantalla: si otra persona guardó cambios antes, la API responde **409** y no sobrescribe nada.

```json
PUT /api/insumos/ins-queso
{ "stockMinimo": 6, "version": 3 }
```

## Usuarios (solo admin)

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/usuarios` | Lista de usuarios con su rol, sucursal y estado |
| POST | `/usuarios` | `{ nombre, email, password, rol, sucursalId, empleadoId }` |
| PUT | `/usuarios/:id` | Cambia datos, rol, sucursal, estado o contraseña |
| DELETE | `/usuarios/:id` | Desactiva el usuario (no se borra) |

La contraseña debe tener entre 12 y 72 caracteres y se guarda con bcrypt. El admin no puede desactivarse ni quitarse el rol a sí mismo, y siempre debe quedar al menos un admin activo (409).

## General

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/salud` | Estado de la API y de PostgreSQL (503 si la base no responde) |
| GET | `/sucursales` | Lista de sucursales |
| GET | `/dashboard?sucursalId=` | Indicadores del tablero |
| GET | `/notificaciones?sucursalId=` | Alertas de stock y pagos próximos |
| GET | `/buscar?q=` | Búsqueda global |
| GET, POST | `/clientes` | Listar (`?q=&activo=`) / crear cliente |
| GET, PUT | `/clientes/:id` | Obtener / editar cliente |
| DELETE | `/clientes/:id` | Desactivar (409 para "Consumidor final") |
| GET, PUT | `/configuracion` | Identidad visual (GET es público; PUT solo admin) |
| GET | `/configuracion/fuentes` | Tipografías disponibles |
| POST | `/sistema/reiniciar` | Restablece los datos de demostración (solo admin; no existe en producción) |

## Ventas (POS)

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/ventas?sucursalId=&desde=&hasta=&tipoComprobante=&estado=&pagina=&porPagina=` | Ventas paginadas (`?fecha=` filtra un solo día) |
| GET | `/ventas/:id` | Comprobante con cliente, sucursal, caja y quién atendió (`atendio`) |
| POST | `/ventas` | Registrar venta |
| PATCH | `/ventas/:id/anular` | Anular venta del turno abierto |

```json
POST /api/ventas
{
  "cajaId": "suc-central-caja-01",
  "tipoComprobante": "CCF",
  "clienteId": "cli-roble",
  "tipoOrden": "comer_aqui",
  "metodoPago": "efectivo",
  "montoRecibido": 20,
  "items": [{ "productoId": "prod-latte-grande", "cantidad": 2 }]
}
```

**IVA (D-14):** los precios del menú ya incluyen el 13 %. El total es la suma de las líneas; `subtotal` es el valor sin IVA (cada línea ÷ 1.13) e `iva` la diferencia. Un Latte grande de $2.75 se cobra $2.75: $2.43 sin IVA y $0.32 de IVA. La factura de consumidor final muestra el total con el IVA incluido; el crédito fiscal, las líneas sin IVA, el 13 % y el total.

## Productos, recetas e inventario

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/categorias` | Categorías del menú |
| GET | `/productos?sucursalId=&categoriaId=&q=&activo=` | Productos con precio sin IVA, costo, margen, receta y unidades disponibles |
| GET | `/productos/:id` | Detalle |
| POST | `/productos` | Crear producto elaborado (con receta) o de reventa |
| PUT | `/productos/:id` | Actualizar (con `version`) |
| DELETE | `/productos/:id` | Baja lógica |
| GET | `/insumos?sucursalId=&activo=` | Insumos con existencia, estado y versión |
| POST | `/insumos` | Crear insumo |
| PUT | `/insumos/:id` | Actualizar insumo (con `version`; `activo: true` lo reactiva) |
| DELETE | `/insumos/:id` | Desactivar (409 si lo usa la receta de un platillo activo) |
| GET | `/inventario/resumen?sucursalId=` | Tarjetas del módulo |
| GET | `/inventario/alertas?sucursalId=` | Alertas de stock mínimo |
| GET | `/inventario/movimientos?sucursalId=&limite=` | Movimientos de inventario |
| POST | `/inventario/entradas` | Entrada de insumo (`insumoId`) o reventa (`productoId`) |

## Caja

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/cajas?sucursalId=` | Cajas con su turno abierto y totales en vivo |
| POST | `/cajas/:id/apertura` | `{ montoInicial, denominaciones, responsable }` |
| GET | `/cajas/:id/resumen` | Resumen del turno abierto |
| POST | `/cajas/:id/cierre` | `{ efectivoContado }` → totales y diferencia |
| GET | `/turnos?sucursalId=&dias=` | Historial de turnos |
| GET | `/caja/metodos-pago?sucursalId=` | Ventas del día por método |

## Compras

| Método | Ruta | Descripción |
|---|---|---|
| GET, POST | `/proveedores` | Listar (`?activo=`) / crear |
| GET, PUT | `/proveedores/:id` | Obtener / actualizar |
| DELETE | `/proveedores/:id` | Desactivar (ya no recibe compras) |
| GET | `/compras?tipo=&proveedorId=&desde=&hasta=&pagina=&porPagina=` | Historial paginado, con quién la registró (`registradoPor`) |
| GET | `/compras/resumen` | Compras y gastos del mes, saldo por pagar |
| POST | `/compras` | Registrar factura (costo o gasto) |
| GET | `/cuentas-por-pagar` | Cuentas con estado calculado |
| PATCH | `/cuentas-por-pagar/:id/pagar` | `{ monto }` pago total o abono |
| GET, POST | `/ordenes-compra` | Órdenes sugeridas |

## Recursos humanos

| Método | Ruta | Descripción |
|---|---|---|
| GET, POST | `/empleados` | Listar (`?q=&estado=&sucursalId=`) / crear |
| GET | `/empleados/cargos` | Cargos disponibles |
| PUT, DELETE | `/empleados/:id` | Actualizar / dar de baja |
| GET | `/planillas` | Historial |
| GET | `/planillas/calculo?fecha=` | Vista previa del periodo |
| POST | `/planillas` | Generar planilla del periodo |
| GET | `/planillas/:id` | Detalle |
| PATCH | `/planillas/:id/pagar` | Marcar como pagada |

## Pronóstico

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/pronostico?sucursalId=&dias=7` | Resumen, serie, consumo por insumo, alertas y pedidos |

## Bitácora (solo admin)

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/bitacora?usuarioId=&entidad=&accion=&desde=&hasta=&pagina=&porPagina=` | Quién cambió qué y cuándo, de lo más reciente a lo más antiguo |

Cada cambio que termina bien (POST, PUT, PATCH o DELETE con respuesta 2xx) y cada inicio de sesión quedan registrados con el usuario, la acción, el módulo, el registro afectado y un resumen de los datos enviados, sin contraseñas ni imágenes.

| Acción | Ejemplo |
|---|---|
| `crear`, `actualizar`, `desactivar` | `POST /productos`, `PUT /insumos/:id`, `DELETE /clientes/:id` |
| La última parte de la ruta | `apertura` y `cierre` de caja, `anular` una venta, `pagar` una cuenta o planilla, `entradas` de inventario, `reiniciar` |
| `inicio_sesion` | `POST /auth/login` correcto |

## Colección de Postman

[`docs/postman/origenes-sv.postman_collection.json`](../postman/origenes-sv.postman_collection.json) trae 35 peticiones con sus pruebas: login (guarda el token), uso del token, 400, 401, 403, 404 y 409. Antes de correrla escribe tu `SEED_PASSWORD` en la variable `password` de la colección.
