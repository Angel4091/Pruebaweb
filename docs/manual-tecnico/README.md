# Manual técnico — Orígenes SV

## 1. Arquitectura

```
┌──────────────────────────┐      HTTP/JSON (REST)      ┌────────────────────────────────────┐
│  Frontend (React + Vite) │  ───────────────────────▶  │  Backend (Express 5)               │
│  pages → services/api.js │  ◀───────────────────────  │  routes → controller → service     │
│  context, hooks, ui      │        /api/...            │        → repository (SQL con pg)   │
└──────────────────────────┘                            └──────────────────┬─────────────────┘
                                                                           │ pool de conexiones
                                                                    PostgreSQL 16 (Docker)
```

- **Frontend:** SPA en React. Cada módulo es una página (`apps/frontend/src/pages`) cargada con `React.lazy` desde `routes/AppRouter.jsx`. Los datos se piden con `fetch` mediante `services/api.js` (async/await, `try/catch`, errores convertidos a `ApiError`).
- **Backend:** monolito modular en Express. Cada área vive en `apps/backend/src/modules/<modulo>/` con cuatro archivos:
  - `*.routes.js`: define los endpoints y sus validaciones de entrada.
  - `*.controller.js`: traduce la petición HTTP a una llamada al servicio y responde el código adecuado.
  - `*.service.js`: aplica las reglas del negocio y decide qué operaciones van en una transacción.
  - `*.repository.js`: es el único lugar con SQL; consultas en minúsculas y siempre parametrizadas (`$1`, `$2`…).
- **Errores:** los de negocio se lanzan como `AppError` con su código HTTP. Los de PostgreSQL (registro duplicado, llave foránea, check) se traducen a 409 o 422 con un mensaje genérico; nunca se envía el texto de la base de datos.
- **Persistencia:** `config/database.js` crea el pool de `pg` y ofrece `withTransaction`, que hace `begin`, `commit` y `rollback` si algo falla. El esquema está en `database/schema.sql` (`npm run db:init`) y los datos de demo en `database/seeds/seed.mjs` (`npm run db:seed`).

### 1.1 Transacciones

| Operación | Qué se guarda junto | Qué se bloquea |
|---|---|---|
| Venta | correlativo, venta, detalle, descuento de inventario y movimientos | turno de la caja, insumos de la receta, correlativo |
| Anulación | estado de la venta y devolución de insumos | la venta |
| Compra | compra, detalle, entradas de inventario con costo promedio, cuenta por pagar y orden recibida | cada insumo comprado |
| Cierre de caja | totales por método, efectivo contado y diferencia | el turno |
| Planilla | planilla y su detalle por empleado | — (la quincena es única en la tabla) |
| Abono a proveedor | pago y nuevo saldo | la cuenta por pagar |

Los bloqueos (`select ... for update`) evitan que dos cajas vendan el último insumo al mismo tiempo o que se emitan dos comprobantes con el mismo número. Las filas se bloquean siempre en el mismo orden (por id) para no generar bloqueos cruzados.

### 1.2 Reglas que también cuida la base de datos

- Las existencias nunca quedan en negativo (`check (cantidad >= 0)`).
- Una caja no puede tener dos turnos abiertos (índice único parcial `turnos_un_abierto_por_caja_uidx`).
- Un CCF solo se emite a un cliente contribuyente con NIT y NRC (`clientes_contribuyente_check`).
- La misma factura no se registra dos veces para un proveedor, ni la misma quincena dos veces.

### 1.3 Seguridad

| Capa | Dónde | Qué hace |
|---|---|---|
| Inicio de sesión | `modules/auth` | Compara la contraseña con bcrypt (costo 12) y firma un JWT HS256 de 8 horas con emisor y audiencia. Si el correo no existe compara igual contra un hash de relleno, para no revelar qué correos están registrados. Máximo 10 intentos fallidos cada 15 minutos por IP. |
| Autenticación | `middlewares/auth.js` | Exige `Authorization: Bearer <token>`, verifica firma, algoritmo, emisor, audiencia y vencimiento, y vuelve a leer el usuario de la base (si está desactivado → 401). |
| Roles | `middlewares/roles.js` → `permitir(...)` | Cada ruta declara qué roles la usan (`TODOS`, `GESTION`, `CAJA`, `SOLO_ADMIN`); si no → 403. |
| Sucursal | `limitarASuSucursal`, `deSuSucursal`, `sucursalDe` | Quien no es admin solo consulta o modifica su sucursal: si pide otra → 403, y los listados sin sucursal devuelven la suya. Para recursos con id (caja, venta, empleado, cuenta por pagar) se busca su sucursal antes de actuar. |
| Encabezados | `helmet()` en `app.js` | CSP, `nosniff`, protección contra iframes y sin `X-Powered-By`. |
| Límites | `app.js` | 300 peticiones por minuto por IP (`RATE_LIMIT_POR_MINUTO`); cuerpos JSON de 100 kb, salvo productos (1.5 MB) y configuración (3 MB) por las imágenes (D-09). |
| Arranque | `server.js` | Sin un `JWT_SECRET` de 32 caracteres o más, o con `CORS_ORIGIN=*` en producción, la API no arranca. |

### 1.4 Bitácora, versiones y paginación

- **Bitácora** (`middlewares/bitacora.js`, `modules/bitacora`): el middleware `registrarCambios` envuelve `res.json`. Cuando un POST, PUT, PATCH o DELETE responde 2xx, guarda en la tabla `bitacora` el usuario, la acción (método o última parte de la ruta), el módulo (primera parte de la ruta), el id afectado y un resumen del cuerpo sin contraseñas ni imágenes. Se guarda justo antes de responder; si la bitácora falla, solo se anota en la consola del servidor y la operación sigue (D-30). El login se registra en `auth.controller.js`.
- **Versión** (D-19): `guardarProducto` y `guardarInsumo` hacen `update … where id = $1 and version = $n`. Si nadie más lo cambió, la versión sube en 1; si no se actualiza ninguna fila, el servicio responde 409 con `registroDesactualizado`.
- **Paginación** (`utils/filtros.js`): `leerPaginacion`, `leerRangoFechas` y `leerActivo` validan la query string (400 si no tiene sentido). Los repositorios de ventas, compras y bitácora hacen dos consultas con los mismos filtros: `count(*)` y la página con `limit`/`offset` (D-31).
- **Bajas lógicas**: clientes, proveedores e insumos se desactivan con `DELETE` (`activo = false`). Un cliente o proveedor desactivado ya no se puede usar en una venta o compra (422); un insumo no se desactiva mientras lo use la receta de un platillo activo (409).

## 2. Lógica de negocio principal

### 2.1 Ventas y facturación (`ventas.service.js`)
1. Verifica que la caja tenga un turno abierto (409 si está cerrada).
2. Valida comprobante (`FCF` o `CCF`), tipo de orden y método de pago. El CCF exige cliente con NIT y NRC (422).
3. Agrupa y valida los items (cantidades enteras positivas, productos activos).
4. `calcularTotales` (con `desglosarIva` de `utils/money.js`): los precios incluyen IVA (D-14). **Total** = suma de las líneas; **subtotal** = suma de cada línea ÷ 1.13 redondeada; **IVA** = total − subtotal. Así las líneas sin IVA del crédito fiscal siempre suman el subtotal.
5. En efectivo, el monto recibido no puede ser menor al total; se calcula el cambio.
6. `calcularRequerimientos` convierte los items en insumos (por receta) y unidades de reventa; `validarExistencias` responde 409 con el detalle de faltantes.
7. Se asigna el correlativo por sucursal y tipo: `FCF-01-000123`, `CCF-02-000045`.
8. `aplicarConsumo` descuenta inventario y deja la bitácora en `movimientosInventario`.

La **anulación** (`PATCH /ventas/:id/anular`) solo se permite en turnos abiertos y devuelve los insumos al inventario.

### 2.2 Inventario y recetas (`inventario.service.js`, `productos.service.js`)
- Insumos con existencia por sucursal (`stock: { 'suc-central': 15, ... }`), unidad base (kg, lt, und), stock mínimo y costo promedio.
- Estado: `agotado` (≤ 0), `por_agotarse` (< mínimo) o `disponible`.
- **Costo promedio ponderado** en cada entrada: `(existencia × costo actual + cantidad × costo nuevo) / (existencia + cantidad)`.
- Costo de un platillo = Σ (cantidad del insumo × costo unitario). Margen = (precio − costo) / precio.
- Unidades disponibles de un platillo = mínimo de `existencia / cantidad requerida` entre sus insumos.

### 2.3 Compras (`compras.service.js`)
- Tipo `costo`: líneas de insumos → entrada a inventario + costo promedio.
- Tipo `gasto`: monto y descripción, sin afectar inventario.
- Condición `credito`: crea una cuenta por pagar con vencimiento según los días de crédito del proveedor; admite abonos parciales. Estado calculado: `pendiente`, `vencida` o `pagada`.
- Órdenes de compra: se crean desde el pronóstico y se marcan `recibida` al registrar la factura que las referencia.

### 2.4 Caja (`caja.service.js`)
- Apertura: fondo inicial (se puede calcular desde el desglose de billetes; si se envían ambos deben coincidir).
- Efectivo esperado = fondo inicial + ventas en efectivo del turno.
- Cierre: guarda totales por método (efectivo, tarjeta, bitcoin), efectivo contado y **diferencia = contado − esperado**.

### 2.5 Planilla (`utils/planilla.js`, `rrhh.service.js`)
- Salario quincenal = salario mensual / 2.
- **ISSS** = 3 % con techo de $15.00 por quincena (techo de cotización de $1,000 mensuales).
- **AFP** = 7.25 %.
- **Renta**: base gravada = salario − ISSS − AFP, con la tabla de retención quincenal:

| Tramo | Desde | Hasta | % sobre exceso | Exceso de | Cuota fija |
|---|---|---|---|---|---|
| I | $0.01 | $275.00 | Sin retención | — | — |
| II | $275.01 | $447.62 | 10 % | $275.00 | $8.83 |
| III | $447.63 | $1,019.05 | 20 % | $447.62 | $30.00 |
| IV | $1,019.06 | en adelante | 30 % | $1,019.05 | $144.28 |

- No se puede generar dos veces la planilla del mismo periodo (409).

### 2.6 Pronóstico (`pronostico.service.js`)
- Explota las ventas de los últimos 14 días en consumo diario por insumo.
- Pronóstico diario = promedio móvil de 7 días × factor del día de la semana.
- Cobertura = existencia / consumo diario promedio. Riesgo si la existencia está bajo el mínimo o la cobertura es menor al horizonte.
- Cantidad sugerida = consumo proyectado + stock mínimo − existencia (redondeado hacia arriba).

## 3. Frontend

| Carpeta | Contenido |
|---|---|
| `context/AuthContext.jsx` | Sesión: `iniciarSesion`, `cerrarSesion`, el usuario de `/auth/me` al abrir la app y `puedeVer` / `puede` según el rol. Si la API responde 401, vuelve al login con un aviso. |
| `context/AppContext.jsx` | Sucursal activa (el admin la elige y queda en localStorage; los demás roles usan la suya), configuración de marca aplicada como variables CSS, modo oscuro, toasts y una versión de datos para refrescar vistas. |
| `utils/permisos.js` | Qué pantallas y acciones ve cada rol. Solo oculta módulos y botones: quien decide es la API (403). |
| `hooks/useFetch.js` | Ejecuta una promesa, expone `data`, `loading`, `error` y `reload`, e ignora respuestas tardías. |
| `services/` | `api.js` (cliente HTTP; guarda el token en sessionStorage y lo envía como `Authorization: Bearer`) e `index.js` (un objeto de servicio por módulo). |
| `components/ui` | Botón, tarjetas KPI, panel, insignias, modal accesible, paginación, toasts, switch, estados de carga y error. |
| `components/charts` | Gráfica de líneas (con curvas suaves y tooltip), dona y barras en SVG, sin librerías externas. |
| `components/decor` | Pirámide, greca, escena del encabezado e ilustraciones SVG de platillos e insumos. |

**Fotos:** `FotoProducto` y `FotoInsumo` (`components/decor/FoodArt.jsx`) cargan `public/img/platillos/<id>.jpg` y `public/img/insumos/<id>.jpg`, o la foto que se subió al crear el platillo (campo `imagen`, base64 de hasta 1 MB). Si la foto no existe o falla, muestran una ilustración SVG.

**Logo:** `Logo` (`components/decor/Decor.jsx`) usa el PNG transparente del logo como máscara CSS, así se pinta con cualquier color de la marca (dorado en el menú, azul en la barra superior). Si en Identidad Visual se sube un logo propio, se usa ese.

**Ornamentos mayas:** `components/decor/Decor.jsx` reúne las ilustraciones SVG propias: `EscenaEncabezado` (templo, ceiba y quetzal), `Greca` (xicalcoliuhqui), `Cresteria`, `OrnamentoTitulo`, `EsquinaGreca`, `BordeEscalonado` y `SolMaya`. La clase CSS `.escalonado` recorta los íconos de las tarjetas con esquinas en escalón (`clip-path`).

**Rutas protegidas:** `routes/AppRouter.jsx` deja `/login` público; el resto pasa por `RequiereSesion` (sin sesión lleva al login y recuerda la pantalla pedida) y por `SoloRol` (si el rol no incluye el módulo, muestra `SinAcceso`). El menú lateral y la guía muestran solo los módulos del rol.

**Tema:** los colores viven en variables CSS (`--c-primario`, `--c-secundario`, …) que Tailwind expone como clases (`bg-primario`, `text-texto`). El módulo Identidad Visual las modifica en tiempo real.

## 4. Requisitos técnicos del proyecto y dónde se cumplen

| Requisito | Ubicación |
|---|---|
| `let` / `const`, funciones y métodos | Todo el código; p. ej. `utils/planilla.js`, `services/*.js` |
| Tipos string, number, boolean, object | Modelos de datos en `database/seeds/seed.mjs` |
| Arreglos e iteradores en React | `map`, `filter`, `reduce` en todas las páginas (catálogo, tablas, gráficas) |
| Hooks de React | `useState`, `useEffect`, `useMemo`, `useCallback`, `useRef`, `useContext`, hooks propios |
| Componentes y Tailwind | `components/ui`, `components/layout` |
| Enrutador | `routes/AppRouter.jsx` (React Router 7) |
| Promesas y asincronía | `services/api.js`, `Promise.all` en `AppContext.jsx` |
| Patrón REST y HTTP | `apps/backend/src/modules/*/*.routes.js` (GET, POST, PUT, PATCH, DELETE; 200, 201, 400, 404, 409, 413, 422, 500, 503) |
| try/catch y manejo de errores | `api.js`, páginas (`try/catch` en cada acción), `middlewares/errorHandler.js` |

## 5. Despliegue

Los pasos completos y las opciones gratuitas están en el [README](../../README.md#-despliegue). Los archivos están en `deploy/`:

| Archivo | Qué hace |
|---|---|
| `deploy/nginx.conf` | Puerto 80: redirige a HTTPS y atiende la validación de Let's Encrypt. Puerto 443: TLS 1.2 y 1.3, HTTP/2, sirve `apps/frontend/dist` (con `try_files … /index.html` para las rutas de React), manda `/api/` a Express en `127.0.0.1:3000` con la IP real del cliente (`X-Forwarded-For`), comprime con gzip, guarda en caché un año los archivos de `/assets/` y agrega a las páginas HSTS, CSP, `nosniff`, `Referrer-Policy` y `Permissions-Policy`. |
| `deploy/origenes-api.service` | Servicio de systemd: arranca la API con el servidor y la reinicia si se cae. |

**La CSP de las páginas:** `script-src 'self'` (ningún script de otro sitio ni en línea); `style-src` permite `'unsafe-inline'` porque los componentes usan atributos `style` (por ejemplo, la máscara del logo y los colores de la marca) y Google Fonts; `img-src 'self' data:` porque el logo y las fotos subidas viajan en base64; `connect-src 'self'` porque la app solo habla con su propia API.

**Cómo se probó (19 nov):** con NginX 1.24 (la versión de Ubuntu 24.04) en Docker, un certificado de prueba, el build real y la API local.
- `nginx -t` pasa sin advertencias.
- 21 comprobaciones: redirección 80 → 443, rutas de React, HTTP/2, TLS 1.1 rechazado y TLS 1.3 aceptado, HSTS, CSP, caché, gzip, proxy a `/api`, 401 sin token por HTTPS, encabezados de la API sin duplicar y un cuerpo de 5 MB rechazado con 413.
- En el navegador, las 9 pantallas, la guía y la bitácora sin ninguna violación de la CSP, y una venta completa que descontó la receta del Latte.

## 6. Pruebas

`npm test` ejecuta `apps/backend/tests` con `node:test` contra la base `origenes_test` (separada de la de desarrollo), que se vuelve a crear con los datos de demo antes de cada archivo de pruebas. Si PostgreSQL no está levantado, las pruebas que lo necesitan se omiten con un aviso.
- Tramos de renta, techo del ISSS y AFP.
- IVA del 13 %, descuento de receta del Latte grande, correlativos, validación de CCF, faltantes de stock, anulación, apertura doble y cuadre de caja.
- Una venta rechazada no consume el correlativo ni el inventario (transacción).
- Rutas de la API: salud, menú, venta (201), sucursal inexistente (404), parámetro faltante (400), JSON mal formado (400) y ruta inexistente (404).
- Reglas de la Fase 5 (`reglas.test.js`): IVA incluido en FCF y CCF, margen sobre el precio sin IVA, quién atendió y quién registró la compra, 409 por versión vieja en productos e insumos, alta, edición y baja de clientes, insumos en uso (409), proveedores desactivados (422 al comprar), paginación y filtros de ventas y compras (incluidos los 400), y la bitácora (venta, anulación, login, sin contraseñas, lo que falla no se registra, solo admin).
- Colección de Postman (`docs/postman`): 35 peticiones con 42 pruebas de punta a punta.
- Seguridad (`seguridad.test.js`): login correcto e incorrecto (mismo 401 para correo inexistente), tokens con otra firma, otra audiencia, vencidos o sin algoritmo (401), permisos de cada rol (403), acceso a otra sucursal (403), reglas de usuarios (correo repetido, contraseña corta, no desactivarse a sí mismo, sesión inválida al desactivar), encabezados de helmet, límite de peticiones y cuerpo de más de 100 kb (413).
