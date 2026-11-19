# Manual de usuario — Orígenes SV

Este manual explica cómo usar cada módulo del sistema en el día a día de una sucursal.

## Antes de empezar

- **Iniciar sesión:** entra con tu correo y tu contraseña. La sesión dura 8 horas y se cierra al cerrar la pestaña. Para salir, toca tus iniciales (arriba a la derecha) y luego **Cerrar sesión**. Si el administrador te quita el acceso o la sesión vence, el sistema vuelve a la pantalla de inicio de sesión y te avisa.
- **Lo que ve cada rol:**

  | Módulo | Administrador | Gerente | Cajero | Barista |
  |---|---|---|---|---|
  | Inicio y Punto de venta | sí | sí | sí | sí |
  | Inventario y recetas | sí | sí | solo consultar | solo consultar |
  | Caja | sí | sí | sí | no |
  | Compras, Personal y Pronóstico | sí | su sucursal | no | no |
  | Generar y pagar la planilla | sí | no | no | no |
  | Identidad visual y Administración | sí | no | no | no |

- **Sucursal activa:** el administrador elige *Sucursal Central* o *Sucursal San Miguel* en la barra superior, y todos los módulos muestran los datos de esa sucursal. Los demás roles trabajan siempre con la suya.
- **Notificaciones (campana):** muestra insumos por agotarse y pagos a proveedores próximos a vencer. Toca una notificación para ir al módulo correspondiente.
- **Búsqueda:** escribe al menos dos letras para buscar productos, insumos, empleados, proveedores o comprobantes.
- **Modo claro / oscuro:** botones de sol y luna en la barra superior.
- **Guía:** el botón *Guía* resume los módulos y el flujo de un turno.

## Flujo de un turno

1. **Abrir caja** (módulo Caja).
2. **Vender** en el Punto de venta.
3. **Revisar alertas** de inventario y registrar compras si hace falta.
4. **Cerrar turno** contando el efectivo.

## 1. Caja y turnos

**Abrir la caja**
1. Elige la caja (Caja 01 o Caja 02) con las pestañas de la parte superior.
2. En *Apertura de caja*, toca las denominaciones ($1, $5, $10, $20) para contar el fondo inicial. El monto se suma solo.
3. Toca **Confirmar apertura**.

**Durante el turno**, *Resumen de caja* muestra las ventas del turno, el efectivo esperado (fondo inicial + ventas en efectivo) y los cobros con tarjeta y Chivo.

**Cerrar el turno**
1. Cuenta el efectivo y escríbelo en *Efectivo contado*.
2. Revisa la *Diferencia*: “Caja en orden” si cuadra, o el faltante / sobrante.
3. Toca **Cerrar turno** y confirma. El turno aparece en *Historial de turnos*.

## 2. Punto de venta

1. Elige el tipo de orden: **Comer aquí**, **Para llevar** o **Delivery**.
2. Toca los platillos para agregarlos. Usa el buscador o el filtro de categorías. La etiqueta *Quedan N* avisa cuando quedan pocos según el inventario; *Agotado* bloquea el producto.
3. En el carrito ajusta cantidades con − / + o quita productos con ✕. Los precios del menú ya incluyen el IVA: el total es la suma de la orden, y debajo se ve el valor sin IVA y el 13 % incluido.
4. **Tipo de comprobante:** *Factura* (consumidor final) o *Crédito fiscal (CCF)*. El CCF exige seleccionar un cliente contribuyente con NIT y NRC; puedes crearlo con el botón **+** junto a *Cliente*.
5. **Método de pago:** Efectivo, Tarjeta o Bitcoin (Chivo).
6. Toca **Cobrar**. En efectivo, escribe el monto recibido (o usa los botones rápidos) y verifica el cambio. En tarjeta o Chivo puedes anotar la referencia.
7. Toca **Confirmar venta**. Se muestra el comprobante con su correlativo (por ejemplo `FCF-01-000824`) y el nombre de quien atendió, listo para **Imprimir**. La factura muestra el total con el IVA incluido; el crédito fiscal muestra cada línea sin IVA, el 13 % y el total.

> Si la caja está cerrada, el POS lo indica y el botón Cobrar se bloquea hasta abrirla.

## 3. Inventario y recetas

- **Tarjetas superiores:** total de insumos, productos por agotarse, en stock y valor del inventario.
- **Listado de insumos:** existencia, stock mínimo y estado (*Disponible*, *Por agotarse*, *Agotado*). Usa *Filtros* y el buscador. La pestaña *Empacados* muestra los productos de reventa.
  - 👁 muestra los datos del insumo y sus movimientos recientes (ventas, compras, entradas).
  - ✏️ permite editar nombre, unidad, stock mínimo, costo y proveedor.
  - **Nuevo insumo** agrega un insumo al catálogo.
- **Receta del platillo:** elige un platillo para ver sus ingredientes, cantidades, costo por platillo y margen.
- **Registrar entrada:** suma existencias de un insumo o de un producto empacado (por ejemplo, un ajuste o una donación). Para compras con factura usa el módulo Compras.
- **Ver recetas:** lista todos los platillos con su costo y margen (calculado sobre el precio sin IVA), y permite crear un **Nuevo platillo** con su receta.
- **Editar o desactivar un insumo** (administrador y gerente): toca ✏️. **Desactivar** lo quita del inventario, salvo que lo use la receta de un platillo activo. Si otra persona guardó cambios en ese insumo mientras lo editabas, el sistema te avisa para que lo vuelvas a abrir.

## 4. Compras y proveedores

1. Elige **Compra de insumos (costo)** o **Gasto operativo** (luz, agua, alquiler…).
2. Selecciona el proveedor (o créalo con **+**), escribe el número de factura o CCF y la condición de pago.
3. Para insumos, agrega líneas con insumo, cantidad y costo unitario. Para gastos, escribe el monto y la descripción.
4. Toca **Registrar factura**. Las compras de insumos aumentan el inventario de la sucursal y actualizan el costo promedio. Si la condición es *Crédito*, se crea una cuenta por pagar.
- **Cuentas por pagar:** toca **Pagar** para registrar un pago total o un abono.
- **Historial:** compras y gastos de la sucursal de 10 en 10, con quién registró cada factura (en pantallas anchas).
- **Órdenes de compra pendientes:** las genera el módulo Pronóstico. Toca **Recibir** para cargar la orden en el formulario y registrarla al llegar la factura.

## 5. RR. HH. y planilla

- **Personal:** busca, filtra, agrega (**Agregar empleado**), edita (✏️) o da de baja (🗑) a un empleado. La baja conserva su historial.
- **Planilla quincenal:** muestra el periodo actual con salarios, ISSS (3 %), AFP (7.25 %), renta y total neto.
  1. Toca **Generar planilla** para guardarla (solo el administrador).
  2. Al pagar, toca **Marcar como pagada** (solo el administrador). El gerente ve la planilla de su sucursal.
  3. **Ver detalle por empleado** abre la planilla completa para imprimir.
- **Historial de pagos:** planillas anteriores; 👁 abre su detalle.

## 6. Pronóstico

- **Predicción de consumo:** compara el consumo real con el pronóstico (costo de insumos por día). Cambia entre 7 y 14 días.
- **Consumo por ingrediente:** insumos más usados en los últimos 7 días.
- **Alertas de posibles faltantes:** insumos que no alcanzan para el periodo; **Comprar** crea una orden de compra.
- **Pedidos sugeridos por proveedor:** **Generar pedido** crea las órdenes de compra de todos los proveedores y te lleva a Compras.

## 7. Identidad visual

- Sube el **logo** (PNG o JPG, máximo 2 MB), cambia el nombre y el eslogan.
- Ajusta la **paleta de colores** tocando cada círculo, y las **tipografías**.
- Activa o desactiva bordes, sombras, animaciones y el modo oscuro predeterminado.
- La **Vista previa** y toda la aplicación cambian mientras editas. Toca **Guardar cambios** para conservarlos o **Descartar** para volver atrás.

## 8. Administración (solo el administrador)

- **Accesos:** lista de usuarios con su rol, sucursal y estado.
  - **Nuevo usuario:** nombre, correo, rol, sucursal (el administrador trabaja con todas), empleado vinculado (opcional) y una contraseña de 12 a 72 caracteres.
  - ✏️ cambia los datos, el rol, la sucursal o la contraseña (déjala en blanco para no cambiarla).
  - 👤✕ quita el acceso: la persona ya no puede entrar y, si tenía la sesión abierta, se cierra en su siguiente acción. 👤✓ se lo devuelve.
  - Nadie puede quitarse el acceso ni el rol de administrador a sí mismo, y siempre queda al menos un administrador activo.
- **Bitácora:** quién cambió qué y cuándo (ventas, anulaciones, aperturas y cierres de caja, compras, pagos, cambios de menú, inventario, usuarios e inicios de sesión). Filtra por usuario, módulo y fechas; se muestra de 12 en 12.
- **Datos de demostración:** **Restablecer datos de demostración** borra lo registrado y vuelve a cargar el menú, el inventario y 14 días de ventas de ejemplo. Pide confirmación y no está disponible en producción.
