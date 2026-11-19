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

## Rutas

La lista completa (método, ruta, rol requerido, cuerpo y respuestas de cada una de las 68 rutas) está en [`docs/endpoints.md`](../endpoints.md).

## Ejemplo: registrar una venta

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

**IVA incluido (D-14):** los precios del menú ya incluyen el 13 %. El total es la suma de las líneas; `subtotal` es el valor sin IVA (cada línea ÷ 1.13) e `iva` la diferencia. Un Latte grande de $2.75 se cobra $2.75: $2.43 sin IVA y $0.32 de IVA. La factura de consumidor final muestra el total con el IVA incluido; el crédito fiscal, las líneas sin IVA, el 13 % y el total.

## Contraseñas de los usuarios

La contraseña debe tener entre 12 y 72 caracteres y se guarda con bcrypt. El admin no puede desactivarse ni quitarse el rol a sí mismo, y siempre debe quedar al menos un admin activo (409).

## Bitácora

Cada cambio que termina bien (POST, PUT, PATCH o DELETE con respuesta 2xx) y cada inicio de sesión quedan registrados con el usuario, la acción, el módulo, el registro afectado y un resumen de los datos enviados, sin contraseñas ni imágenes.

| Acción | Ejemplo |
|---|---|
| `crear`, `actualizar`, `desactivar` | `POST /productos`, `PUT /insumos/:id`, `DELETE /clientes/:id` |
| La última parte de la ruta | `apertura` y `cierre` de caja, `anular` una venta, `pagar` una cuenta o planilla, `entradas` de inventario, `reiniciar` |
| `inicio_sesion` | `POST /auth/login` correcto |

## Colección de Postman

[`docs/postman/origenes-sv.postman_collection.json`](../postman/origenes-sv.postman_collection.json) trae 35 peticiones con sus pruebas: login (guarda el token), uso del token, 400, 401, 403, 404 y 409. Antes de correrla escribe tu `SEED_PASSWORD` en la variable `password` de la colección.
