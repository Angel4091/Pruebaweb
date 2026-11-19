# Guía de la API REST

Base: `http://localhost:3000/api` · Formato: JSON · Errores: `{ "error": "mensaje", "details": {...} }`

| Código | Uso |
|---|---|
| 200 | Consulta o actualización correcta |
| 201 | Recurso creado (POST) |
| 400 | Parámetro faltante o JSON inválido |
| 401 | Sin sesión, token inválido o vencido, o credenciales incorrectas |
| 403 | El rol no tiene permiso o la sucursal no es la del usuario |
| 404 | Recurso o ruta inexistente |
| 409 | Conflicto de negocio (caja cerrada, stock insuficiente, planilla duplicada, registro repetido) |
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
| Configuración (modificar), usuarios y reinicio de datos | sí | no | no | no |

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
| GET, POST | `/clientes` | Listar (`?q=`) / crear cliente |
| GET, PUT | `/configuracion` | Identidad visual (GET es público; PUT solo admin) |
| GET | `/configuracion/fuentes` | Tipografías disponibles |
| POST | `/sistema/reiniciar` | Restablece los datos de demostración (solo admin; no existe en producción) |

## Ventas (POS)

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/ventas?sucursalId=&fecha=&tipoComprobante=&limite=` | Listar ventas |
| GET | `/ventas/:id` | Comprobante con cliente, sucursal y caja |
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

## Productos, recetas e inventario

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/categorias` | Categorías del menú |
| GET | `/productos?sucursalId=&categoriaId=&q=` | Productos con costo, margen, receta y unidades disponibles |
| GET | `/productos/:id` | Detalle |
| POST | `/productos` | Crear producto elaborado (con receta) o de reventa |
| PUT | `/productos/:id` | Actualizar |
| DELETE | `/productos/:id` | Baja lógica |
| GET | `/insumos?sucursalId=` | Insumos con existencia y estado |
| POST | `/insumos` | Crear insumo |
| PUT | `/insumos/:id` | Actualizar insumo |
| GET | `/inventario/resumen?sucursalId=` | Tarjetas del módulo |
| GET | `/inventario/alertas?sucursalId=` | Alertas de stock mínimo |
| GET | `/inventario/movimientos?sucursalId=&limite=` | Bitácora |
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
| GET, POST | `/proveedores` | Listar / crear |
| PUT | `/proveedores/:id` | Actualizar |
| GET | `/compras?sucursalId=&tipo=` | Historial |
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
