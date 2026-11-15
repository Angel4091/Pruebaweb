# Manual técnico — Orígenes SV

## 1. Arquitectura

```
┌──────────────────────────┐      HTTP/JSON (REST)      ┌───────────────────────────────┐
│  Frontend (React + Vite) │  ───────────────────────▶  │  Backend (Express 5)          │
│  pages → services/api.js │  ◀───────────────────────  │  routes → controllers         │
│  context, hooks, ui      │        /api/...            │        → services → db (JSON) │
└──────────────────────────┘                            └───────────────┬───────────────┘
                                                                        │
                                                         database/data.json (seeds)
```

- **Frontend:** SPA en React. Cada módulo es una página (`frontend/src/pages`) cargada con `React.lazy` desde `routes/AppRouter.jsx`. Los datos se piden con `fetch` mediante `services/api.js` (async/await, `try/catch`, errores convertidos a `ApiError`).
- **Backend:** API REST en Express. Las rutas (`routes/index.js`) llaman a controladores delgados; la lógica de negocio vive en `services/`. Los errores de negocio se lanzan como `AppError` con su código HTTP y el middleware `errorHandler` los responde en JSON.
- **Persistencia:** `config/db.js` mantiene los datos en memoria y los escribe en `database/data.json` tras cada cambio (escritura atómica con archivo temporal). Si el archivo no existe, se genera con `database/seeds/seed.mjs`.

## 2. Lógica de negocio principal

### 2.1 Ventas y facturación (`ventas.service.js`)
1. Verifica que la caja tenga un turno abierto (409 si está cerrada).
2. Valida comprobante (`FCF` o `CCF`), tipo de orden y método de pago. El CCF exige cliente con NIT y NRC (422).
3. Agrupa y valida los items (cantidades enteras positivas, productos activos).
4. `calcularTotales`: subtotal, **IVA = subtotal × 0.13** y total, redondeados a 2 decimales.
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
| `context/AppContext.jsx` | Sucursal activa (localStorage), configuración de marca aplicada como variables CSS, modo oscuro, toasts y una versión de datos para refrescar vistas. |
| `hooks/useFetch.js` | Ejecuta una promesa, expone `data`, `loading`, `error` y `reload`, e ignora respuestas tardías. |
| `services/` | `api.js` (cliente HTTP) e `index.js` (un objeto de servicio por módulo). |
| `components/ui` | Botón, tarjetas KPI, panel, insignias, modal accesible, paginación, toasts, switch, estados de carga y error. |
| `components/charts` | Gráfica de líneas (con curvas suaves y tooltip), dona y barras en SVG, sin librerías externas. |
| `components/decor` | Pirámide, greca, escena del encabezado e ilustraciones SVG de platillos e insumos. |

**Fotos:** `FotoProducto` y `FotoInsumo` (`components/decor/FoodArt.jsx`) cargan `public/img/platillos/<id>.jpg` y `public/img/insumos/<id>.jpg`, o la foto que se subió al crear el platillo (campo `imagen`, base64 de hasta 1 MB). Si la foto no existe o falla, muestran una ilustración SVG.

**Logo:** `Logo` (`components/decor/Decor.jsx`) usa el PNG transparente del logo como máscara CSS, así se pinta con cualquier color de la marca (dorado en el menú, azul en la barra superior). Si en Identidad Visual se sube un logo propio, se usa ese.

**Calendario maya:** `utils/calendarioMaya.js` convierte la fecha al día juliano y aplica la correlación GMT (584283) para obtener la Cuenta Larga, el Tzolk'in (260 días) y el Haab' (365 días). `NumeroMaya` dibuja los numerales en base 20 (punto = 1, barra = 5, concha = 0). Valores de control: 21/12/2012 → 13.0.0.0.0, 4 Ajaw 3 K'ank'in.

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
| Patrón REST y HTTP | `backend/src/routes/index.js` (GET, POST, PUT, PATCH, DELETE; 200, 201, 400, 404, 409, 422, 500) |
| try/catch y manejo de errores | `api.js`, páginas (`try/catch` en cada acción), `middlewares/errorHandler.js` |

## 5. Despliegue

1. `npm run build --prefix frontend` genera `frontend/dist`.
2. Sirve `frontend/dist` con NginX o Apache y redirige `/api` al backend (`node backend/src/server.js`, puerto 3000).

Ejemplo de NginX:

```nginx
server {
  listen 80;
  root /var/www/origenes/frontend/dist;
  location / { try_files $uri /index.html; }
  location /api/ { proxy_pass http://127.0.0.1:3000; }
}
```

## 6. Pruebas

`npm test` ejecuta `backend/tests` con `node:test`, usando un archivo de datos temporal:
- Tramos de renta, techo del ISSS y AFP.
- IVA del 13 %, descuento de receta del Latte grande, correlativos, validación de CCF, faltantes de stock, anulación y cuadre de caja.
