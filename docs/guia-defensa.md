# Guía de defensa

La defensa individual vale el 40 % y, según los lineamientos, quien no pueda explicar su parte pierde la evaluación. Esta guía sirve para prepararla:

1. Lee la **solución en 5 minutos** (sección 1): todos deben poder contarla.
2. Estudia los **archivos de tu parte** (sección 2) y ábrelos mientras lees la sección 4.
3. Practica el **recorrido de una venta** (sección 3): es la pregunta más probable.
4. Responde en voz alta las **preguntas** de la sección 6 sin mirar la respuesta.

Toda la solución se hizo con apoyo de IA ([`uso-de-ia.md`](uso-de-ia.md)). Por eso es todavía más importante que cada quien pueda explicar *por qué* el código hace lo que hace, no solo *qué* hace.

## 1. La solución en 5 minutos

- **Qué es:** un ERP y punto de venta para Orígenes SV, un restaurante con varias sucursales en El Salvador. Cubre ventas con factura y crédito fiscal, inventario con recetas, compras, caja por turno, personal con planilla quincenal y un pronóstico de insumos.
- **Tecnologías:**
  - Frontend: React 19 con Vite y Tailwind.
  - Backend: Express 5 sobre Node.js 22.
  - Base de datos: PostgreSQL 16 con el paquete `pg` y SQL escrito a mano, sin ORM.
  - Despliegue: NginX como proxy inverso con HTTPS.
- **Arquitectura:** un **monolito modular**. Un solo backend dividido en 12 módulos; cada módulo tiene 4 capas: rutas → controlador → servicio → repositorio. Solo el repositorio tiene SQL ([`arquitectura.md`](arquitectura.md)).
- **Roles:** admin (todo, todas las sucursales), gerente (su sucursal), cajero (POS, inventario de consulta y caja) y barista (POS e inventario de consulta). La API revisa cada permiso; el frontend solo esconde lo que el rol no usa.
- **Reglas clave:**
  - Vender un Latte grande descuenta 18 g de café, 250 ml de leche, 1 vaso, 1 tapadera y 1 viñeta, en una sola transacción.
  - Los precios incluyen el 13 % de IVA.
  - La planilla aplica ISSS 3 % (con techo), AFP 7.25 % y la tabla de renta quincenal.

## 2. Qué estudia cada integrante

Cada quien estudia los tickets de su rol en el [seguimiento](seguimiento/seguimiento.csv) (también en [Excel](seguimiento/seguimiento.xlsx)). Además de su parte, **todos** deben dominar las secciones 1, 3 y 6. Las rutas de `modules/`, `middlewares/`, `utils/` y `config/` están dentro de `apps/backend/src`; las de `context/`, `hooks/`, `pages/` y `routes/`, dentro de `apps/frontend/src`.

| Integrante y rol | Tickets | Archivos que debe dominar | Debe poder explicar |
|---|---|---|---|
| Diego Chávez · Backend: base de datos | DB-001 a DB-003, BE-020, BE-031 a BE-033 | `database/schema.sql`, `database/seeds/seed.mjs`, `config/database.js`, `config/datos-demo.js`, `apps/backend/scripts/`, `docker-compose.yml`, los `*.repository.js` de `inventario`, `productos`, `pronostico`, `tablero` y `bitacora`, `middlewares/bitacora.js`, `utils/filtros.js` | Tablas y relaciones, `check`, llaves foráneas e índices; el pool de `pg` y `withTransaction`; el seed con bcrypt desde `SEED_PASSWORD`; el SQL parametrizado de los repositorios; la bitácora y la paginación en el servidor |
| Diego Guzmán · Backend: lógica de negocio | BE-010 a BE-013, BE-021, BE-030 | `modules/ventas`, `modules/caja`, `modules/compras`, `modules/rrhh`, `utils/money.js`, `utils/planilla.js` | La transacción de una venta, el descuento por receta y el correlativo; el IVA incluido; la apertura, el cierre y el cuadre de caja; la versión (409); una compra que suma inventario, actualiza el costo promedio y crea la cuenta por pagar; el cálculo de la planilla |
| Ángel Monterrosa · Backend: API REST con Express | OP-001, BE-001 a BE-004, BE-022, OP-002 | `app.js`, `server.js`, `config/env.js`, `routes/index.js`, `modules/auth`, `modules/usuarios`, `modules/general`, `middlewares/auth.js`, `middlewares/roles.js`, `middlewares/validate.js`, `middlewares/errorHandler.js`, `package.json` (scripts), `deploy/` | Rutas → controlador → servicio → repositorio; login con bcrypt y qué lleva el JWT; 401 frente a 403 y la sucursal; helmet y los límites; los códigos HTTP; las bajas lógicas; NginX y HTTPS |
| Rodrigo Alas · Frontend: rutas y diseño | FE-001, FE-003, FE-005 | `routes/AppRouter.jsx`, `utils/permisos.js`, `pages/Login.jsx`, `pages/SinAcceso.jsx`, `components/layout/` (`Layout`, `Sidebar`, `Topbar`) | Las rutas protegidas y por rol, qué ve cada rol en el menú, la pantalla de inicio de sesión, Tailwind y la identidad visual |
| Alexei Valle · Frontend: hooks y React | FE-002, FE-004 | `main.jsx`, `context/AuthContext.jsx`, `context/AppContext.jsx`, `hooks/`, `services/api.js`, `pages/Administracion.jsx` | `useState`, `useEffect`, `useContext` y los hooks propios; cómo viaja el token y qué pasa con un 401; los estados de carga y error; el módulo Administración |
| Luis Murcia · Control de calidad | QA-001, QA-003 | `apps/backend/tests/`, `tests/helpers/base-de-pruebas.js` | Cómo se prueba con `node:test` contra una base separada, qué cubre cada archivo de pruebas, la venta completa y la prueba en un clon limpio |
| Rubén Martínez · Documentación y pruebas | QA-002, DOC-001; coordina DOC-003 | `docs/postman/`, `docs/arquitectura.md`, `docs/endpoints.md`, `docs/manual-usuario/`, `docs/requisitos-tecnicos.md`, `docs/uso-de-ia.md` | Cómo se corre la colección de Postman, los diagramas, los endpoints, el manual y el informe IEEE |
| Yukio Ogawa · Product owner | OP-000, DOC-002 | `docs/lineamientos.pdf`, `docs/decisiones.md`, `CONTRIBUTING.md`, `docs/seguimiento/`, esta guía | Qué pide el caso, por qué se tomó cada decisión, el flujo de ramas y pull requests, el avance por ticket y el guion de la demo |

## 3. Recorrido de una venta, de principio a fin

Ejemplo: un cajero de la Sucursal Central cobra un Latte grande en efectivo. El mismo recorrido está como diagrama en [`arquitectura.md`](arquitectura.md#5-recorrido-de-una-venta-de-principio-a-fin).

1. **Pantalla.**
   - En `pages/PuntoVenta.jsx`, el cajero toca el platillo y se agrega al carrito.
   - El total se calcula con `desglosarIva` (`utils/iva.js`): la suma de la orden, con el IVA incluido.
   - Al confirmar, la página llama a `ventasService.crear(…)` (`services/index.js`).
2. **Cliente HTTP.** `services/api.js` hace `fetch('POST /api/ventas')` con el JSON de la orden y el encabezado `Authorization: Bearer <token>`. El token lo guardó el login en `sessionStorage`.
3. **NginX** (en producción) recibe la petición por HTTPS y la reenvía a Express en `127.0.0.1:3000` (`deploy/nginx.conf`).
4. **`app.js`.** `helmet` agrega los encabezados de seguridad, el límite de peticiones cuenta la IP y `express.json` rechaza cuerpos de más de 100 kb (413).
5. **`routes/index.js`.** Antes de llegar al módulo pasan tres middlewares:
   - `autenticar` verifica el JWT y vuelve a leer al usuario de la base (401 si falta, si vence o si el usuario está desactivado).
   - `limitarASuSucursal` revisa que no pida otra sucursal (403).
   - `registrarCambios` prepara la bitácora.
6. **`ventas.routes.js`.** También pasa tres filtros antes del controlador:
   - `permitir(TODOS)` revisa el rol (403).
   - `requireFields(['cajaId', 'items'])` revisa los campos obligatorios (400).
   - `cajaPropia` revisa que la caja sea de su sucursal (403).
7. **`ventas.controller.js` → `crear`** toma el cuerpo y el usuario de la sesión y llama al servicio.
8. **`ventas.service.js` → `crearVenta`**, dentro de `withTransaction` (`begin` … `commit`):
   - Bloquea el turno abierto de la caja (`for update`). Si la caja está cerrada, 409.
   - Valida el comprobante, el método de pago y el cliente. El CCF exige NIT y NRC (422).
   - Carga los productos con su receta y calcula los totales con IVA incluido.
   - `validarExistencias` bloquea las existencias de los insumos en orden de id y revisa que alcancen. Si falta algo, 409 y no se guarda nada.
   - Toma el siguiente correlativo de la sucursal, inserta la venta y su detalle, descuenta el inventario y registra los movimientos.
   - Si cualquier paso falla, `rollback`: no se guarda la venta, ni el correlativo, ni el descuento.
9. **Repositorios.** Ejecutan el SQL con parámetros (`$1, $2…`), por ejemplo en `ventas.repository.js` → `insertarVenta`.
10. **Respuesta.**
    - El controlador responde **201 Created** con el comprobante (cliente, sucursal, caja y quién atendió).
    - Justo antes de enviar, el middleware de bitácora guarda "crear · ventas · id de la venta".
11. **Vuelta a la pantalla.** `PuntoVenta.jsx` muestra el ticket para imprimir y el aviso "Venta registrada"; el carrito se vacía.

**Si algo sale mal**, el servicio lanza un `AppError` con su código (404, 409, 422). `middlewares/errorHandler.js` lo convierte en `{ "error": "mensaje" }`. Si es un error de PostgreSQL, responde un mensaje genérico, nunca el texto de la base. En la pantalla, `api.js` convierte la respuesta en un `ApiError` y la página muestra el mensaje en un aviso rojo.

## 4. Qué hace cada archivo

### Backend: base

| Archivo | Qué hace |
|---|---|
| `src/server.js` | Revisa la configuración de seguridad (sin `JWT_SECRET` no arranca), prueba la conexión a PostgreSQL y luego escucha en el puerto |
| `src/app.js` | Crea la app de Express: helmet, CORS, límite de peticiones, `express.json` con sus límites, las rutas bajo `/api` y el manejador de errores |
| `src/routes/index.js` | Junta los módulos: primero las rutas públicas y el login, después `autenticar` → `limitarASuSucursal` → `registrarCambios` y el resto |
| `src/config/env.js` | Lee `.env` y deja la configuración en un solo objeto (puerto, CORS, JWT, base de datos) |
| `src/config/database.js` | El pool de `pg`, `withTransaction` (`begin`, `commit`, `rollback`) y `insertarFilas` |
| `src/config/datos-demo.js` | Carga los datos de demo dentro de una transacción |
| `src/middlewares/auth.js` | `autenticar`: verifica el JWT y carga al usuario (401) |
| `src/middlewares/roles.js` | `permitir(roles)` (403), los grupos de roles y las reglas de sucursal |
| `src/middlewares/validate.js` | Campos y parámetros obligatorios (400) |
| `src/middlewares/bitacora.js` | Registra cada cambio que termina bien |
| `src/middlewares/errorHandler.js` | Respuestas de error genéricas y traducción de los errores de PostgreSQL |
| `src/utils/money.js` | `round2` y `desglosarIva` (IVA incluido) |
| `src/utils/planilla.js` | ISSS, AFP y la tabla de renta quincenal |
| `src/utils/filtros.js` | `?activo=`, paginación y rango de fechas, con sus validaciones |

### Backend: cada módulo

Todos siguen el mismo patrón (`modulo.routes.js` → `.controller.js` → `.service.js` → `.repository.js`). Lo que hay que saber explicar de cada servicio:

| Módulo | Reglas del servicio |
|---|---|
| `auth` | Compara con bcrypt; si el correo no existe compara contra un hash de relleno (mismo tiempo de respuesta); firma el JWT HS256 de 8 h |
| `usuarios` | Contraseña de 12 a 72 caracteres; nadie se quita a sí mismo el acceso o el rol admin; siempre queda un admin activo |
| `ventas` | Transacción de la sección 3; anular devuelve los insumos y solo se permite con el turno abierto |
| `caja` | Un turno abierto por caja; el cierre compara lo esperado contra lo contado por método de pago |
| `productos` | Margen sobre el precio sin IVA; unidades disponibles según la receta y las existencias; versión al editar |
| `inventario` | Entradas con costo promedio ponderado; alertas bajo el mínimo; un insumo usado en una receta activa no se desactiva |
| `compras` | Una compra de insumos suma inventario y, si es a crédito, crea la cuenta por pagar; la misma factura no entra dos veces |
| `rrhh` | Planilla quincenal; el gerente solo ve las líneas de su sucursal; generar y pagar es del admin |
| `pronostico` | Promedio de los últimos 7 días × factor del día de la semana; cobertura y pedido sugerido por proveedor |
| `tablero` | Indicadores del día, notificaciones y búsqueda limitada a las pantallas del rol |
| `general` | Sucursales, clientes (consumidor final no se desactiva), identidad visual y reinicio de datos de demo |
| `bitacora` | Consulta con filtros y paginación; nunca guarda contraseñas ni imágenes |

### Frontend

| Archivo | Qué hace |
|---|---|
| `main.jsx` | Monta `AuthProvider`, `AppProvider` y el enrutador |
| `context/AuthContext.jsx` | La sesión: login, logout, `/auth/me` al abrir y permisos del rol |
| `context/AppContext.jsx` | Sucursal activa, identidad visual (colores como variables CSS), modo oscuro y avisos |
| `routes/AppRouter.jsx` | Rutas con `React.lazy`; `RequiereSesion` y `SoloRol` protegen las pantallas |
| `services/api.js` | `fetch` con `async/await`, el token Bearer, `ApiError` y la vuelta al login ante un 401 |
| `services/index.js` | Un objeto de servicio por módulo (`ventasService.crear`, `usuariosService.listar`…) |
| `hooks/useFetch.js` | Pide datos y expone `data`, `loading`, `error` y `reload` |
| `utils/permisos.js` | Qué pantallas y acciones ve cada rol |
| `components/layout/` | Menú lateral, barra superior y guía rápida |
| `components/ui/index.jsx` | Botones, paneles, modales, paginación y estados de carga, error y vacío |
| `pages/*.jsx` | Una página por módulo: POS, Inventario, Compras, Caja, Personal, Pronóstico, Identidad Visual y Administración |

## 5. Decisiones que conviene saber defender

Todas están en [`decisiones.md`](decisiones.md); estas son las que más se preguntan.

| Decisión | En una frase |
|---|---|
| D-03 · Sin API Gateway | El Caso 1 no tiene sistemas externos que integrar; los lineamientos no lo piden |
| D-06 · `pg` sin ORM | SQL escrito a mano, como en clase, siempre parametrizado |
| D-14 · IVA incluido | Así se emiten los comprobantes en El Salvador: el precio del menú es lo que paga el cliente |
| D-19 · Versión del registro | Dos personas editando a la vez no se pisan: la segunda recibe 409 |
| D-27 · JWT de 8 horas | Cubre un turno; se vuelve a leer el usuario en cada petición para que una baja aplique de inmediato |
| D-28 · El gerente, solo su sucursal | Cada gerente responde por su sucursal; la planilla de toda la empresa la paga el admin |
| D-29 · Token en sessionStorage | La computadora de caja es compartida: la sesión se cierra al cerrar la pestaña |
| D-30 · Bitácora con middleware | Un solo archivo registra todos los cambios de todos los módulos |
| D-31 · Paginación en el servidor | Solo en lo que crece todos los días: ventas, compras y bitácora |

## 6. Preguntas probables del docente

**1. ¿Por qué un monolito y no microservicios o un API Gateway?**
Es un solo negocio con pocas sucursales y un solo equipo. Un monolito modular se despliega, prueba y depura más fácil, y separado en capas sigue ordenado. Los lineamientos no piden un gateway para el Caso 1 (D-03). Si mañana hiciera falta separar un módulo, ya tiene sus 4 capas propias.

**2. ¿Cómo funciona el inicio de sesión? ¿Qué lleva el token?**
`auth.service.js` → `iniciarSesion` busca el usuario por correo y compara la contraseña con `bcrypt.compare` (nunca se guarda en texto plano). Si coincide, firma un JWT HS256 con:
- el id del usuario en `sub`;
- su rol y su sucursal;
- el emisor `origenes-sv-api` y la audiencia `origenes-sv-web`;
- un vencimiento de 8 horas.

En cada petición, `autenticar` verifica la firma, el algoritmo, el emisor, la audiencia y el vencimiento, y vuelve a leer al usuario de la base.

**3. ¿Qué diferencia hay entre 401 y 403 en su sistema?**
401: no sabemos quién eres (falta el token, está vencido, está alterado o el usuario fue desactivado). 403: sabemos quién eres, pero tu rol o tu sucursal no te permiten eso. Por ejemplo, un cajero que pide `/api/compras` recibe 403 (`middlewares/roles.js`).

**4. ¿Cómo se descuenta el inventario al vender un Latte grande? ¿Y si falta leche?**
- La receta está en la tabla `recetas`.
- `calcularRequerimientos` multiplica cada insumo por la cantidad vendida.
- `validarExistencias` bloquea esas existencias (`for update`) y revisa que alcancen.
- Si falta leche, responde 409 con el faltante; como todo está en una transacción, no se guarda nada (`ventas.service.js`, `inventario.service.js`).

**5. ¿Qué pasa si dos cajas venden el último vaso al mismo tiempo?**
La primera venta bloquea la fila del insumo con `select … for update`. La segunda espera a que la primera termine, y entonces ve que ya no hay vasos y recibe 409. Las filas se bloquean siempre en orden de id para que dos ventas no se bloqueen entre sí. El correlativo también se bloquea, así dos cajas nunca sacan el mismo número de factura.

**6. ¿Cómo calculan el IVA en la factura y en el crédito fiscal?**
Los precios del menú incluyen el 13 % (D-14). El total es la suma de la orden. El valor sin IVA es cada línea ÷ 1.13 redondeada, y el IVA es la diferencia (`utils/money.js` → `desglosarIva`). Un Latte de $2.75 da $2.43 sin IVA y $0.32 de IVA. La factura muestra el total con el IVA incluido; el CCF muestra las líneas sin IVA, el 13 % aparte y el mismo total.

**7. ¿Cómo calculan la planilla?** (`utils/planilla.js`)

| Paso | Regla | Con un salario de $950 al mes |
|---|---|---|
| Salario quincenal | Salario mensual ÷ 2 | $475 |
| ISSS | 3 %, con techo de $15 por quincena | $14.25 |
| AFP | 7.25 % | $34.44 |
| Base gravada | Quincena − ISSS − AFP | $426.31 |
| Renta | Tabla quincenal: el tramo II cobra 10 % sobre el exceso de $275 más $8.83 | $23.96 |
| Líquido | Quincena − ISSS − AFP − renta | $402.35 |

**8. ¿Cómo evitan la inyección SQL?**
Todas las consultas usan parámetros (`$1, $2…`) y los valores viajan aparte del texto del SQL: PostgreSQL nunca los interpreta como código. Nunca se concatenan valores, y solo los repositorios tienen SQL.

**9. ¿Qué hace NginX y qué protege HTTPS? ¿Reemplaza al JWT?**
- **NginX** recibe todo por el puerto 443 con TLS 1.2 o 1.3. Entrega el frontend compilado y reenvía `/api` a Express, que no está expuesto a internet. El puerto 80 solo redirige a HTTPS.
- **HTTPS** cifra lo que viaja y confirma la identidad del servidor con el certificado.
- **No reemplaza al JWT ni a los roles.** Protege el canal, pero no decide quién puede hacer qué: por HTTPS, una petición sin token sigue recibiendo 401 (clase 14).

**10. ¿Cómo garantizan que un gerente no vea los datos de otra sucursal?**
Hay tres controles en el backend (`middlewares/roles.js`):
- `limitarASuSucursal` rechaza con 403 cualquier `sucursalId` ajeno, en la consulta o en el cuerpo.
- `sucursalDe(req)` fuerza su sucursal en los listados.
- `deSuSucursal` busca la sucursal de un recurso con id (caja, venta, empleado, cuenta) antes de actuar.

El frontend también le fija la sucursal, pero quien decide es la API.

**11. ¿Qué es la "versión" de un registro y por qué responde 409?**
Productos e insumos tienen una columna `version`. Al guardar, el `update` incluye `where version = $n`. Si otra persona guardó antes, la versión ya cambió, no se actualiza ninguna fila y la API responde 409 ("alguien más lo modificó"), en lugar de borrar sin aviso el cambio del otro (D-19).

**12. Usaron IA: ¿cómo saben que el código funciona y qué hicieron ustedes?**
- **Se verificó:** 75 pruebas automáticas, 42 pruebas de Postman, pruebas en el navegador con cada rol, una venta completa por fase, un clon limpio por fase y NginX probado en Docker.
- **Se corrigió:** las pruebas encontraron errores de la IA que se arreglaron, por ejemplo el IVA sumado encima del precio y un 422 que debía ser 400.
- **Lo que hizo el equipo:** definió las reglas, aprobó cada fase y revisó el resultado ([`uso-de-ia.md`](uso-de-ia.md)).
- **Lo que debe poder hacer cada uno:** explicar su parte con esta guía.

## 7. Guion para la demo

1. **Preparar:** `npm run db:up`, `npm run db:seed` y `npm run dev`. Abre `http://localhost:5173`.
2. **Cajero** (`cajero@origenes.test`):
   - En Caja, muestra el turno abierto y el cuadre por método de pago. Los datos de demo dejan las cajas abiertas: para mostrar la apertura, cierra un turno y ábrelo de nuevo.
   - Vende un Latte grande en efectivo y muestra el comprobante con "Atendió".
   - En Inventario, muestra que bajaron el café y la leche, y que no puede editar.
3. **Crédito fiscal:** vende 2 Latte con CCF al cliente "Comercial El Roble": las líneas van sin IVA y el total es el mismo.
4. **Gerente** (`gerente@origenes.test`):
   - Solo ve San Miguel.
   - En Compras, registra una factura a crédito y muestra la cuenta por pagar.
   - En Personal, muestra que ve la planilla pero no puede generarla.
5. **Admin** (`admin@origenes.test`): cambia de sucursal, abre Administración (usuarios y bitácora con la venta del paso 2) y Pronóstico.
6. **Seguridad:** en Postman, muestra un 401 sin token, un 403 del cajero pidiendo compras y un 409 al editar con una versión vieja.
7. **Despliegue:** explica `deploy/nginx.conf` con el diagrama de [`arquitectura.md`](arquitectura.md).
