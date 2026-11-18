# 🏛️ Orígenes SV — ERP y POS

> Sistema centralizado de ventas, inventario con recetas, compras, caja y recursos humanos para **Restaurante Orígenes SV**, negocio de comida de especialidad con varias sucursales en El Salvador.

Proyecto de Cátedra de **Programación Web — Ciclo 02, 2026**. Corresponde al **Caso de negocio 1: ERP y POS para "Restaurante Orígenes SV"**.

---

## 🧩 Módulos

| Módulo | Qué resuelve |
|---|---|
| **Inicio** | Ventas del día, órdenes, ticket promedio, estado de cajas, productos más vendidos, ventas por sucursal y alertas. |
| **Punto de venta (POS)** | Toma ágil de pedidos (comer aquí, para llevar, delivery). Emite **Factura de Consumidor Final (FCF)** y **Comprobante de Crédito Fiscal (CCF)** con correlativos por sucursal y **13 % de IVA**. Cobro en efectivo (con cambio), tarjeta o **Bitcoin (Chivo Wallet)**. |
| **Inventario y recetas** | Cada venta de un producto elaborado **descuenta automáticamente los insumos de su receta** (ej. *Latte grande*: 18 g de café, 250 ml de leche, 1 vaso de 16 oz, 1 tapadera y 1 viñeta). Menú de **14 productos elaborados** + **4 productos empacados de reventa**. Alertas de stock mínimo, entradas de inventario y costo promedio ponderado. |
| **Compras y proveedores** | Registro de facturas de compra de insumos (afectan inventario) y de gastos operativos; **cuentas por pagar** con abonos y vencimientos. |
| **Caja y turnos** | Apertura con fondo inicial por denominación, resumen en vivo y **cierre con cuadre** de efectivo, tarjeta y Bitcoin; historial de turnos. |
| **RR. HH. y planilla** | Gestión de empleados (baristas, cajeros, cocineros, gerentes) y **planilla quincenal** con **ISSS 3 %** (techo de $1,000), **AFP 7.25 %** y **retención de renta** según la tabla quincenal. |
| **Pronóstico** | Consumo proyectado por insumo con promedio móvil, días de cobertura, alertas de faltantes y **órdenes de compra sugeridas** por proveedor. |
| **Identidad visual** | Logo, nombre, eslogan, paleta de colores, tipografías, sombras, bordes, animaciones y modo oscuro, aplicados en vivo a toda la app. |

### Identidad maya

El diseño toma elementos de la cultura maya: el logo de Orígenes SV (*¡Puchica, qué buen sabor!*), un templo con crestería, la ceiba sagrada y el quetzal en el encabezado, la greca escalonada (*xicalcoliuhqui*) al pie de página, un borde dorado de dientes escalonados en el menú lateral, una pequeña pirámide con escalinata bajo cada título, crestería escalonada bajo los encabezados de panel, íconos con esquinas en escalón y grecas en las tarjetas de indicadores, y un sol maya (inspirado en el glifo *K'in*) como indicador de carga.

Las fotos de platillos e insumos provienen de Wikimedia Commons con licencias libres; ver [créditos de imágenes](docs/creditos-imagenes.md).

## 🛠️ Tecnologías

- **Frontend:** React 19 + Vite, React Router, Hooks (`useState`, `useEffect`, `useMemo`, `useCallback`, `useContext`, hooks propios), Tailwind CSS 4, íconos Lucide.
- **Backend:** Node.js + Express 5, API REST con controladores, servicios y middlewares de validación y errores.
- **Persistencia:** archivo JSON (`database/data.json`) generado desde los *seeds*, para que el proyecto funcione en cualquier equipo con solo `npm install` (sin instalar un motor de base de datos).
- **Pruebas:** `node:test` (planilla, IVA, recetas, correlativos, cuadre de caja).

## 📁 Estructura del repositorio

```
.
├── backend/                 # API REST (Node.js + Express)
│   ├── src/
│   │   ├── config/          # Variables de entorno y capa de datos (JSON)
│   │   ├── controllers/     # Traducen HTTP ⇄ servicios
│   │   ├── middlewares/     # Validación y manejo central de errores
│   │   ├── routes/          # Definición de rutas REST
│   │   ├── services/        # Lógica de negocio por módulo
│   │   └── utils/           # IVA, planilla, fechas, ids, errores
│   └── tests/               # Pruebas unitarias e integración de servicios
├── frontend/                # Aplicación React (Vite)
│   └── src/
│       ├── components/      # layout, ui, charts, decor (ilustraciones)
│       ├── context/         # Estado global (sucursal, marca, toasts)
│       ├── hooks/           # useFetch, useDebounce
│       ├── pages/           # Un archivo por módulo
│       ├── routes/          # React Router
│       ├── services/        # Cliente HTTP y servicios por módulo
│       └── utils/           # Formateadores
├── database/
│   ├── seeds/seed.mjs       # Datos iniciales (menú, recetas, historial)
│   └── migrations/
├── docs/                    # Manuales, guía técnica, IEEE, seguimiento
├── CONTRIBUTING.md          # Gitflow y formato de commits
└── package.json             # Scripts para correr todo junto
```

## 🚀 Instalación y ejecución

Requisitos: **Node.js 20 o superior** y npm.

```bash
git clone https://github.com/Angel4091/Pruebaweb.git
cd Pruebaweb
npm run install:all
npm run dev
```

- Web: http://localhost:5173
- API: http://localhost:3000/api

La primera vez que arranca, la API crea `database/data.json` a partir de los seeds. Para volver a los datos iniciales:

```bash
npm run seed
```

Pruebas del backend:

```bash
npm test
```

### Variables de entorno (opcionales)

Copia `backend/.env.example` a `backend/.env` si necesitas cambiar el puerto, el archivo de datos o el origen permitido por CORS. En el frontend, `VITE_API_URL` permite apuntar a una API desplegada en otro dominio.

## 🌿 Flujo de trabajo (Gitflow)

- `main`: versión estable y entregable
- `develop`: integración del trabajo del equipo
- `feature/<nombre>/<ticket>`: una rama por ticket (sale de `develop` y vuelve por pull request)

Formato de commits: `[gitmoji] [prefijo]: descripción` — por ejemplo `✨ feat: Agrega la toma de pedidos en el POS`. Detalle en [CONTRIBUTING.md](CONTRIBUTING.md).

## 📚 Documentación

- [Manual de usuario](docs/manual-usuario/README.md)
- [Manual técnico](docs/manual-tecnico/README.md)
- [Guía técnica de la API REST](docs/guia-tecnica/api-rest.md)
- Informe IEEE: `docs/investigacion-ieee/`
- [Seguimiento de tickets por integrante](docs/seguimiento/seguimiento.csv)
- [Registro de decisiones](docs/decisiones.md)
- [Lineamientos del proyecto](docs/lineamientos.pdf) y [material de clase](docs/clases/README.md)

## 🤖 Declaración de uso de IA

En el desarrollo se utilizó un asistente de IA (Claude, de Anthropic) como apoyo para generar código y documentación. Todo uso de IA se declara en la bibliografía del informe, y cada integrante del equipo debe comprender y poder explicar el código entregado.
