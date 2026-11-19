# Guía de la API REST

Base: `http://localhost:3000/api` · Formato: JSON · Errores: `{ "error": "mensaje", "details": {...} }`

| Código | Uso |
|---|---|
| 200 | Consulta o actualización correcta |
| 201 | Recurso creado (POST) |
| 400 | Parámetro faltante o JSON inválido |
| 404 | Recurso o ruta inexistente |
| 409 | Conflicto de negocio (caja cerrada, stock insuficiente, planilla duplicada, registro repetido) |
| 413 | Petición o imagen demasiado grande |
| 422 | Datos inválidos (validaciones o reglas de la base de datos) |
| 500 | Error interno (sin detalles de la base de datos) |
| 503 | La base de datos no responde (`/salud`) |

## General

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/salud` | Estado de la API y de PostgreSQL (503 si la base no responde) |
| GET | `/sucursales` | Lista de sucursales |
| GET | `/dashboard?sucursalId=` | Indicadores del tablero |
| GET | `/notificaciones?sucursalId=` | Alertas de stock y pagos próximos |
| GET | `/buscar?q=` | Búsqueda global |
| GET, POST | `/clientes` | Listar (`?q=`) / crear cliente |
| GET, PUT | `/configuracion` | Identidad visual |
| GET | `/configuracion/fuentes` | Tipografías disponibles |
| POST | `/sistema/reiniciar` | Restablece los datos de demostración |

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
