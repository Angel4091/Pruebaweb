# Registro de decisiones

Cuando dos fuentes piden cosas distintas, manda este orden:

1. [Lineamientos del proyecto](lineamientos.pdf)
2. [Clases de solución técnica](clases/README.md)
3. Acuerdos del equipo

Cada decisión indica las fuentes que chocaban, qué se eligió, por qué y en qué fase del plan se aplica. Si una decisión cambia, se edita aquí y se anota la fecha.

---

## D-01 · Tailwind en lugar de Reactstrap
- **Fuentes:** los lineamientos permiten Reactstrap o Tailwind; las clases 02 y 03 usan Reactstrap.
- **Decisión:** Tailwind CSS 4.
- **Motivo:** el frontend ya está hecho con Tailwind y el diseño está aprobado por el equipo.
- **Fase:** ya aplicada.

## D-02 · Solo JavaScript
- **Fuentes:** las clases 11 y 12 usan PHP para el gateway; los lineamientos no incluyen PHP ni TypeScript entre las tecnologías permitidas.
- **Decisión:** todo en JavaScript (Node.js, Express, React).
- **Motivo:** los lineamientos mandan sobre las clases.
- **Fase:** ya aplicada.

## D-03 · Sin API Gateway en PHP ni API keys
- **Fuentes:** las clases 01, 12 y 15 integran terceros con un gateway en PHP y API keys; el caso 1 no pide integraciones con terceros y los lineamientos no permiten PHP.
- **Decisión:** no se implementa. Las personas entran con login y rol (JWT); no hay sistemas externos.
- **Motivo:** evitar funciones fuera de lo pedido (la clase 15 también lo advierte). Si el docente lo pide, la alternativa es una versión ligera en Express: llave guardada con hash, alcance de solo lectura, vencimiento, revocación y bitácora.
- **Fase:** no aplica.

## D-04 · Roles: admin, gerente, cajero y barista
- **Fuentes:** las clases usan admin, supervisor, técnico y cliente (otro caso); los lineamientos hablan de baristas, cajeros y gerentes.
- **Decisión:**

  | Módulo | admin | gerente | cajero | barista |
  |---|---|---|---|---|
  | Inicio | todas las sucursales | su sucursal | su sucursal | su sucursal |
  | Punto de venta | sí | sí | sí | sí |
  | Anular venta | sí | sí | no | no |
  | Inventario | sí | sí | solo ver | solo ver |
  | Compras | sí | sí | no | no |
  | Caja | sí | sí | su turno | no |
  | Personal y planilla | sí | sí | no | no |
  | Pronóstico | sí | sí | no | no |
  | Identidad visual | sí | no | no | no |
  | Administración | sí | no | no | no |

  Solo el admin cambia de sucursal; los demás quedan fijos en la suya.
- **Motivo:** son los puestos que nombran los lineamientos.
- **Fase:** 3 (backend) y 4 (frontend).

## D-05 · Verbos REST
- **Fuentes:** la clase 13 corrige al docente sobre PUT y POST.
- **Decisión:** `POST` crea, `PUT` o `PATCH` actualiza, `DELETE` elimina o desactiva.
- **Fase:** ya aplicada; se revisa en la 5.

## D-06 · PostgreSQL con `pg`, sin ORM
- **Fuentes:** los lineamientos permiten PostgreSQL o SQL Server y un ORM; las clases 04 a 07 usan PostgreSQL con `pg` y SQL escrito a mano.
- **Decisión:** PostgreSQL con `pg`. SQL en minúsculas, siempre parametrizado (`$1`, `$2`…), nunca concatenado. No hay SQL en controladores ni en componentes de React.
- **Motivo:** cumple ambas fuentes y es lo que se va a defender.
- **Fase:** 2.

## D-07 · npm como gestor de paquetes
- **Fuentes:** la clase 03 usa Yarn; el repositorio ya usa npm con sus lockfiles.
- **Decisión:** npm, y los `package-lock.json` se quedan en el repositorio.
- **Motivo:** cambiar de gestor obligaría a regenerar todos los lockfiles sin ganar nada.
- **Fase:** ya aplicada.

## D-08 · Estructura `apps/`
- **Fuentes:** la clase 03 usa `apps/backend`, `apps/frontend`, `database/` y `scripts/`; al inicio se tomó como referencia el repositorio *asolution* (`backend/` y `frontend/` en la raíz).
- **Decisión:** pasar a `apps/` con `git mv` para conservar el historial.
- **Motivo:** las clases mandan sobre la referencia.
- **Fase:** 1.

## D-09 · Límite del cuerpo JSON
- **Fuentes:** la clase 08 limita `express.json` a 100 kb; la foto de un producto viaja en base64 de hasta 1 MB y el logo de hasta 2 MB.
- **Decisión:** 100 kb para toda la API; unos 1.5 MB solo en las rutas de productos y unos 3 MB en `PUT /configuracion` (logo).
- **Motivo:** proteger la API sin romper la carga de imágenes.
- **Fase:** 3.

## D-10 · Seguimiento del trabajo
- **Fuentes:** los lineamientos piden "un reporte en Excel" con las actividades de cada integrante; el equipo acordó un CSV; las clases 07 y 08 usan Kanban.
- **Decisión:** [`seguimiento/seguimiento.csv`](seguimiento/seguimiento.csv) con una fila por ticket y su estado (pendiente, en curso, en revisión, hecho). Para la entrega se exporta a `.xlsx`.
- **Fase:** 0 y se actualiza en cada fase.

## D-11 · Que funcione al clonar
- **Fuentes:** los lineamientos califican que el proyecto funcione en cualquier equipo donde se clone; PostgreSQL agrega un requisito de instalación.
- **Decisión:** `docker-compose.yml` solo para PostgreSQL, `npm run setup` que explique los pasos y una prueba en un clon limpio al cerrar cada fase.
- **Fase:** 2.

## D-12 · NginX para el despliegue
- **Fuentes:** los lineamientos permiten NginX o Apache; las clases usan NginX.
- **Decisión:** NginX como proxy inverso, con sección de HTTPS (TLS 1.2 y 1.3).
- **Aplicada (19 nov):** [`deploy/nginx.conf`](../deploy/nginx.conf) y un servicio de systemd para la API.
  - La configuración usa `listen 443 ssl http2`, que funciona en NginX 1.24 (Ubuntu 24.04) y en las versiones nuevas.
  - Los encabezados de seguridad de las páginas los pone NginX; los de `/api`, helmet, para no duplicarlos.
  - Se recomienda desplegar todo en un solo servidor, como en clase, y se documenta la alternativa con servicios gratuitos separados.
- **Fase:** 6.

## D-13 · Pantalla de inicio de sesión
- **Fuentes:** el equipo había elegido "solo menú y pantallas", sin login; los roles (D-04) lo hacen necesario.
- **Decisión:** se agrega una pantalla de login con el mismo estilo visual. El resto del diseño no cambia.
- **Fase:** 4 (se adelantó a la 3, junto con el backend de seguridad).

## D-14 · IVA incluido en el precio
- **Fuentes:** los lineamientos piden aplicar el 13 % de IVA; hoy el sistema lo suma encima del precio.
- **Decisión:** los precios del menú incluyen IVA. La factura de consumidor final muestra el total y el IVA incluido; el crédito fiscal muestra el valor sin IVA, el 13 % y el total. Ejemplo: un café de $3.50 se cobra $3.50 (antes $3.96).
- **Aplicada (19 nov):** el subtotal es la suma de cada línea ÷ 1.13 redondeada y el IVA es la diferencia con el total, así las líneas del CCF cuadran. El margen de los productos se calcula sobre el precio sin IVA. Las compras a proveedores siguen con el IVA aparte, porque así llega su crédito fiscal.
- **Motivo:** así se emiten los comprobantes en El Salvador.
- **Fase:** 5.

## D-15 · Unidades del inventario: se mantienen kg, lt y und
- **Fuentes:** los lineamientos describen la receta del Latte grande en g y ml; el inventario usa kg, lt y und.
- **Decisión (cambiada el 18 nov):** se mantienen kg, lt y und, con 4 decimales en la base (18 g de café = 0.0180 kg).
- **Motivo:** al revisar el frontend se vio que la pantalla ya muestra las cantidades pequeñas en g y ml (la receta del Latte aparece como "18 g" y "250 ml"). Guardar en gramos haría que el costo por gramo se viera como "$0.00" y que las compras fueran de "15000 g de queso". La regla de los lineamientos se cumple igual: vender un Latte grande descuenta exactamente 18 g, 250 ml, 1 vaso, 1 tapadera y 1 viñeta, y hay una prueba que lo verifica.
- **Fase:** 2.

## D-16 · El pronóstico se queda
- **Fuentes:** el pronóstico era opcional.
- **Decisión:** se mantiene porque ya funciona.
- **Fase:** ya aplicada.

## D-17 · Commits de cada integrante
- **Fuentes:** los lineamientos califican los commits de cada integrante.
- **Decisión:** cada integrante hace los commits y el pull request de sus tickets con su propio usuario de GitHub, después de revisar y entender el código. El uso de IA se declara en `uso-de-ia.md`.
- **Fase:** desde la 1.

## D-18 · Herramientas de administración
- **Fuentes:** la clase 15 recomienda una sección de herramientas internas solo para el administrador.
- **Decisión:** un módulo "Administración", visible solo para el admin, con las pestañas Accesos (usuarios, rol, sucursal, desactivar), Bitácora y Datos de demo, con el mismo estilo de pestañas de Compras. Antes de cerrarlo se verifica que el menú quepa sin scroll en pantallas bajas; si no cabe, Accesos pasa a una pestaña de Personal.
- **Resultado (18 nov):** con Administración, el menú del admin tiene 9 módulos y a 761 px de alto le faltaban 7 px. El menú compacto ahora empieza en 780 px de alto (antes 760) y así cabe sin scroll en todas las alturas probadas (540 a 781 px). Accesos se queda en Administración. La pestaña Bitácora llega en la Fase 5 con BE-032 y BE-033.
- **Fase:** 3 y 4.

## D-19 · Quién registró y versión del registro
- **Fuentes:** la clase 15 muestra en el detalle el usuario que registró, la fecha y la versión.
- **Decisión:** ventas y compras guardan quién las registró y su versión; el ticket muestra "Atendió: …". Productos e insumos usan la versión para responder 409 si alguien edita con datos viejos.
- **Aplicada (19 nov):** la versión se compara en el mismo `update` (`where version = $n`), así dos ediciones al mismo tiempo nunca se pisan. El historial de compras muestra quién registró cada factura.
- **Fase:** 2 y 5.

## D-20 · Proteger el reinicio de datos
- **Fuentes:** hoy `POST /api/sistema/reiniciar` borra los datos y carga los de demo sin pedir autenticación.
- **Decisión:** solo el admin puede llamarlo, y queda desactivado cuando `NODE_ENV=production`.
- **Fase:** 3.

## D-21 · Lista vacía en los lineamientos
- **Fuentes:** la página 4 de los lineamientos dice "se debe hacer uso de los siguientes elementos vistos en clases:" y no trae la lista.
- **Decisión:** se toman las clases de [`clases/`](clases/README.md) como esa lista. Pendiente confirmarlo con el docente.

## D-22 · Ramas `main` y `develop`
- **Fuentes:** las clases 02 y 03 piden `main` protegida y `develop` para integrar; en GitHub hoy solo existe `develop`.
- **Decisión:** crear `main` desde `develop` y protegerla; todo entra por pull request. El detalle está en [`../CONTRIBUTING.md`](../CONTRIBUTING.md).
- **Fase:** 0.

## D-23 · Identificadores de texto en los catálogos
- **Fuentes:** las clases usan `bigserial` para todas las llaves primarias; el frontend usa los ids actuales ("prod-latte-grande") para encontrar la foto de cada producto e insumo.
- **Decisión:** los catálogos y documentos (sucursales, productos, insumos, ventas, compras, turnos…) conservan su id de texto; las tablas internas (detalles, pagos, usuarios, bitácora) usan `bigserial`.
- **Motivo:** cambiar los ids rompería el contrato con el frontend (clase 05: "hablar el mismo lenguaje en todas las partes").
- **Fase:** 2.

## D-24 · Datos de demo desde JavaScript, no desde seed.sql
- **Fuentes:** la clase 07 lee un `seed.sql`; el historial de ventas debe ser reciente para que Inicio y Pronóstico tengan datos.
- **Decisión:** `npm run db:seed` carga `database/seeds/seed.mjs`, que genera 14 días de ventas contados desde hoy, y los inserta con consultas parametrizadas en una transacción. También crea un usuario por rol con bcrypt y `SEED_PASSWORD`, como en la clase 07.
- **Motivo:** un `seed.sql` con fechas fijas dejaría el tablero vacío a los pocos días.
- **Fase:** 2.

## D-25 · Scripts de base de datos dentro del backend
- **Fuentes:** el plan inicial ponía los scripts en `scripts/` de la raíz; la clase 06 explica que, si un script solo le sirve al backend y usa su conexión, va en el backend.
- **Decisión:** `apps/backend/scripts/db-init.mjs` y `db-seed.mjs`; la raíz solo los llama (`npm run db:init`, `npm run db:seed`). El esquema sigue en `database/schema.sql`, independiente del backend.
- **Fase:** 2.

## D-26 · Pruebas contra una base separada
- **Fuentes:** las pruebas del backend ahora necesitan PostgreSQL.
- **Decisión:** `npm test` usa la base `origenes_test` (la crea el contenedor de Docker) y la vuelve a cargar con los datos de demo antes de cada archivo. Nunca toca la base de desarrollo. Si PostgreSQL no está levantado, las pruebas que lo necesitan se omiten con un aviso.
- **Fase:** 2.

## D-27 · Sesión con JWT de 8 horas
- **Fuentes:** la clase 08 firma el token con HS256 y lo verifica con emisor y audiencia; el turno de una cafetería dura unas 8 horas; la pantalla de login necesita el logo y los colores antes de iniciar sesión.
- **Decisión:** el token dura 8 horas (`JWT_EXPIRES_IN`) y la API no arranca sin un `JWT_SECRET` de al menos 32 caracteres. Son públicas solo `/salud`, la configuración visual (lectura) y el login. En cada petición se vuelve a leer el usuario de la base, así una desactivación o un cambio de rol aplican de inmediato. Las consultas que el POS necesita (menú, cajas, clientes, proveedores para Inventario) están abiertas a todos los roles; las que modifican, no.
- **Motivo:** cubrir un turno completo sin pedir la contraseña a media jornada, sin dejar la API abierta.
- **Fase:** 3.

## D-28 · El gerente trabaja solo con su sucursal
- **Fuentes:** D-04 da al gerente Compras y Personal, pero la planilla es de toda la empresa y la paga la administración.
- **Decisión:** el gerente ve compras, cuentas por pagar, órdenes, empleados y la planilla solo de su sucursal (las líneas de su personal y sus totales). Generar y pagar la planilla es solo del admin. Al registrar un empleado, el gerente lo hace siempre en su sucursal.
- **Motivo:** cada gerente responde por su sucursal; los pagos de toda la empresa los aprueba el admin.
- **Fase:** 3 (backend) y 4 (frontend).

## D-29 · El token se guarda en sessionStorage
- **Fuentes:** el frontend necesita conservar el token entre recargas; en una sucursal, varios turnos usan la misma computadora de caja.
- **Decisión:** el token vive en `sessionStorage`: sobrevive a una recarga, pero se borra al cerrar la pestaña. Al cerrar sesión se vuelve a un login limpio, sin recordar la pantalla anterior, porque el siguiente turno puede ser de otro rol. Si la API responde 401, la app borra el token y vuelve al login con el aviso "Tu sesión terminó".
- **Motivo:** que una sesión no quede abierta para la siguiente persona que use la caja.
- **Fase:** 3.

## D-30 · La bitácora se llena con un middleware
- **Fuentes:** el prompt pide "historial/auditoría (quién cambió qué y cuándo)"; la tabla `bitacora` existe desde la Fase 2.
- **Decisión:** un solo middleware (`registrarCambios`) registra cada POST, PUT, PATCH o DELETE que responde 2xx, con el usuario, la acción, el módulo, el registro y los datos enviados sin contraseñas ni imágenes. El login se registra aparte. Lo que falla no se registra. Si guardar en la bitácora falla, la operación del usuario sigue y el error queda en la consola del servidor.
- **Motivo:** cubre todos los módulos sin tocar cada servicio, y es fácil de explicar en la defensa: un solo archivo decide qué se audita.
- **Fase:** 5.

## D-31 · Qué listados se paginan en el servidor
- **Fuentes:** el prompt pide listados con filtros por query string y paginación.
- **Decisión:** ventas, compras y bitácora (los que crecen todos los días) se paginan en el servidor y responden `{ datos, total, pagina, porPagina, paginas }`. Los catálogos (menú, insumos, clientes, proveedores, empleados) siguen devolviendo la lista completa con el filtro `?activo=`: son cortos y el POS los necesita completos.
- **Fase:** 5.

## D-32 · Un campo requerido que falta es 400
- **Fuentes:** la guía de la API dice "400: parámetro faltante"; `requireFields` respondía 422.
- **Decisión:** si falta un campo requerido, 400 (la petición está incompleta). 422 queda para datos que llegan pero no cumplen una regla (un NIT mal escrito, una cantidad negativa).
- **Fase:** 5.

## D-33 · Dónde queda cada documento
- **Fuentes:** el prompt pide `docs/manual-usuario.md`, `docs/endpoints.md` y `docs/seguimiento.csv`; el repositorio ya tenía las carpetas `docs/manual-usuario/`, `docs/guia-tecnica/` y `docs/seguimiento/`.
- **Decisión:**
  - Se conservan las carpetas del equipo: `docs/manual-usuario/README.md` y `docs/seguimiento/seguimiento.csv` (D-10).
  - Se agregan con el nombre que pide el prompt `docs/arquitectura.md`, `docs/endpoints.md`, `docs/requisitos-tecnicos.md`, `docs/uso-de-ia.md` y `docs/guia-defensa.md`.
  - La lista de rutas vive solo en `endpoints.md`; `guia-tecnica/api-rest.md` queda con las convenciones, para no mantener la misma tabla en dos lugares.
- **Pendiente del equipo:** exportar el seguimiento a Excel con los nombres reales de los integrantes (los lineamientos lo califican) y escribir el informe IEEE fuera del repositorio.
- **Fase:** 7.
