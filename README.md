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
- **Backend:** Node.js + Express 5, API REST organizada por módulos; cada módulo tiene rutas → controlador → servicio → repositorio.
- **Base de datos:** PostgreSQL 16 con el driver `pg`, SQL parametrizado y sin ORM. Las ventas, compras, cierres de caja y planillas se guardan en transacciones. Para desarrollo se levanta con Docker (`docker-compose.yml`).
- **Pruebas:** `node:test` contra una base de pruebas separada (planilla, IVA, recetas, correlativos, transacciones, cuadre de caja y rutas de la API).

## 📁 Estructura del repositorio

```
.
├── apps/
│   ├── backend/                 # API REST (Node.js + Express)
│   │   ├── scripts/             # db-init.mjs y db-seed.mjs
│   │   ├── src/
│   │   │   ├── config/          # Variables de entorno, pool de PostgreSQL y datos de demo
│   │   │   ├── middlewares/     # Autenticación, roles, bitácora, validación y errores
│   │   │   ├── modules/         # Un módulo por área: ventas, caja, inventario, productos,
│   │   │   │                    #   compras, rrhh, pronostico, tablero, general
│   │   │   │                    #   (cada uno con routes, controller, service y repository)
│   │   │   ├── routes/          # Junta las rutas de todos los módulos bajo /api
│   │   │   └── utils/           # IVA, planilla, fechas, ids, errores
│   │   └── tests/               # Pruebas con node:test
│   └── frontend/                # Aplicación React (Vite)
│       └── src/
│           ├── components/      # layout, ui, charts, decor (ilustraciones)
│           ├── context/         # Sesión y estado global (sucursal, marca, toasts)
│           ├── hooks/           # useFetch, useDebounce
│           ├── pages/           # Un archivo por módulo
│           ├── routes/          # React Router
│           ├── services/        # Cliente HTTP y servicios por módulo
│           └── utils/           # Formateadores, permisos por rol e IVA
├── database/
│   ├── schema.sql               # Tablas, reglas (check, llaves foráneas) e índices
│   ├── seeds/seed.mjs           # Datos de demo (menú, recetas, historial de 14 días)
│   └── docker/                  # Crea la base de pruebas al levantar el contenedor
├── deploy/                      # nginx.conf (proxy inverso con HTTPS) y servicio de systemd
├── docs/                        # Manuales, decisiones, clases, Postman, IEEE y seguimiento
├── docker-compose.yml           # PostgreSQL para desarrollo
├── CONTRIBUTING.md              # Gitflow y formato de commits
└── package.json                 # Scripts para instalar y correr todo junto
```

## 🚀 Instalación y ejecución

Requisitos: **Node.js 22.12 o superior**, npm y **Docker Desktop** (o un PostgreSQL 16 propio).

1. Clona el repositorio e instala las dependencias:

   ```bash
   git clone https://github.com/Angel4091/Pruebaweb.git
   cd Pruebaweb
   npm run setup
   ```

2. Copia `apps/backend/.env.example` como `apps/backend/.env` y completa:
   - `DB_PASSWORD`: cualquier contraseña para tu base local.
   - `SEED_PASSWORD`: la contraseña de los usuarios de prueba (12 caracteres o más).
   - `JWT_SECRET`: el secreto que firma las sesiones. Genéralo con `openssl rand -hex 32` (usa otro distinto en producción). Sin él, la API no arranca.

3. Levanta PostgreSQL, crea las tablas y carga los datos de demo:

   ```bash
   npm run db:up
   npm run db:init
   npm run db:seed
   ```

4. Arranca la API y la web:

   ```bash
   npm run dev
   ```

- Web: http://localhost:5173
- API: http://localhost:3000/api (`/api/salud` confirma que la base responde)

`npm run db:seed` también sirve para volver a los datos iniciales. Crea un usuario por rol (`admin`, `gerente`, `cajero` y `barista`, todos `@origenes.test`) con la contraseña de `SEED_PASSWORD`. Con ellos se inicia sesión en la web; cada rol ve solo sus módulos y su sucursal (el admin ve todas).

Pruebas del backend (usan la base `origenes_test`, separada de la de desarrollo; PostgreSQL debe estar levantado):

```bash
npm test
```

Para producción, `npm run build` genera el frontend en `apps/frontend/dist` y `npm start` levanta la API. `npm run db:down` detiene el contenedor de PostgreSQL sin borrar los datos.

### Variables de entorno

Están explicadas en `apps/backend/.env.example` y `apps/frontend/.env.example`. Los archivos `.env` nunca se suben al repositorio. En el frontend, `VITE_API_URL` permite apuntar a una API desplegada en otro dominio.

## 🌐 Despliegue

### En un servidor propio (Ubuntu o Debian, como en clase)

Requisitos: Node.js 22, PostgreSQL 16, NginX y un dominio que apunte a la IP del servidor.

1. Clona el repositorio en `/var/www/origenes` y corre `npm run setup`.
2. Crea `apps/backend/.env` con los valores de producción:
   - `NODE_ENV=production` (además desactiva el reinicio de datos de demo).
   - `CORS_ORIGIN=https://tu-dominio` (nunca `*`: la API no arranca así).
   - `TRUST_PROXY=1`, porque NginX está delante y la API necesita la IP real para su límite de peticiones.
   - `JWT_SECRET`: uno **nuevo**, generado con `openssl rand -hex 32`, distinto al de desarrollo.
   - `DB_*`: los datos de la base del servidor (`DB_SSL=true` si la base está en la nube).
3. `npm run db:init` crea las tablas (y `npm run db:seed` si quieres datos de demo).
4. `npm run build` genera `apps/frontend/dist`.
5. La API como servicio que arranca con el servidor: [`deploy/origenes-api.service`](deploy/origenes-api.service).
6. NginX: copia [`deploy/nginx.conf`](deploy/nginx.conf), cambia el dominio y pide el certificado con `certbot` (los pasos están al inicio del archivo).
7. Deja abiertos solo los puertos 22, 80 y 443 (por ejemplo, `sudo ufw allow OpenSSH` y `sudo ufw allow 'Nginx Full'`): el 3000 de Express y el 5432 de PostgreSQL no deben verse desde internet.
8. Comprueba `https://tu-dominio/api/salud`.

### HTTPS

- El navegador solo habla con NginX, por **HTTPS en el puerto 443** con **TLS 1.2 o 1.3**. El puerto 80 redirige a HTTPS y solo atiende la validación del certificado.
- El certificado es gratis con Let's Encrypt (`certbot`), que también lo renueva.
- NginX agrega a las páginas HSTS (el navegador ya no intenta HTTP), una política de contenido (CSP) que solo permite scripts del propio sitio, y `nosniff`. Las respuestas de `/api` ya traen los encabezados de helmet.
- **HTTPS protege el canal, no reemplaza el JWT ni los roles.** Cifra lo que viaja entre el navegador y el servidor (contraseñas, tokens, ventas) y confirma que te conectas al servidor correcto. Pero no decide quién puede hacer qué: por HTTPS, una petición sin token sigue recibiendo 401 y un cajero que pide compras sigue recibiendo 403.

### Opciones gratuitas

| Opción | Frontend | API (Express) | PostgreSQL |
|---|---|---|---|
| **Un solo servidor** (la de clase; usa `deploy/` tal cual) | NginX | systemd | en el mismo servidor |
| **Servicios separados** | Netlify, Vercel o Cloudflare Pages | Render o Koyeb | Neon o Supabase |

- **Un solo servidor:** sirve una máquina virtual gratuita, como las *Always Free* de Oracle Cloud o la `e2-micro` de Google Cloud, o el crédito para estudiantes de GitHub Student Developer Pack.
- **Servicios separados:** cada servicio da HTTPS automático.
  - En el frontend: `npm run build`, carpeta `apps/frontend/dist`, `VITE_API_URL` con la URL de la API y una regla que envíe todas las rutas a `index.html` (React Router).
  - En la API: `CORS_ORIGIN` con el dominio del frontend y `TRUST_PROXY=1`.
  - En la base: `DB_SSL=true`, y corre `npm run db:init` desde tu equipo apuntando a esa base.
- Los planes gratis tienen límites: por ejemplo, la API de Render se apaga cuando nadie la usa y tarda en despertar, y algunas bases gratuitas se pausan por inactividad. Revisa los límites actuales antes de la entrega.

## 🌿 Flujo de trabajo (Gitflow)

- `main`: versión estable y entregable
- `develop`: integración del trabajo del equipo
- `feature/<nombre>/<ticket>`: una rama por ticket (sale de `develop` y vuelve por pull request)

Formato de commits: `[gitmoji] [prefijo]: descripción` — por ejemplo `✨ feat: Agrega la toma de pedidos en el POS`. Detalle en [CONTRIBUTING.md](CONTRIBUTING.md).

## 📚 Documentación

- [Manual de usuario](docs/manual-usuario/README.md)
- [Manual técnico](docs/manual-tecnico/README.md)
- [Guía técnica de la API REST](docs/guia-tecnica/api-rest.md) y [colección de Postman](docs/postman/origenes-sv.postman_collection.json)
- Informe IEEE: `docs/investigacion-ieee/`
- [Seguimiento de tickets por integrante](docs/seguimiento/seguimiento.csv)
- [Registro de decisiones](docs/decisiones.md)
- [Lineamientos del proyecto](docs/lineamientos.pdf) y [material de clase](docs/clases/README.md)

## 🤖 Declaración de uso de IA

En el desarrollo se utilizó un asistente de IA (Claude, de Anthropic) como apoyo para generar código y documentación. Todo uso de IA se declara en la bibliografía del informe, y cada integrante del equipo debe comprender y poder explicar el código entregado.
