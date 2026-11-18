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
- **Fuentes:** la clase 08 limita `express.json` a 100 kb; la foto de un producto y el logo viajan en base64 de hasta 1 MB.
- **Decisión:** 100 kb para toda la API y unos 1.5 MB solo en las rutas de foto de producto y de logo.
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
- **Fase:** 6.

## D-13 · Pantalla de inicio de sesión
- **Fuentes:** el equipo había elegido "solo menú y pantallas", sin login; los roles (D-04) lo hacen necesario.
- **Decisión:** se agrega una pantalla de login con el mismo estilo visual. El resto del diseño no cambia.
- **Fase:** 4.

## D-14 · IVA incluido en el precio
- **Fuentes:** los lineamientos piden aplicar el 13 % de IVA; hoy el sistema lo suma encima del precio.
- **Decisión:** los precios del menú incluyen IVA. La factura de consumidor final muestra el total y el IVA incluido; el crédito fiscal muestra el valor sin IVA, el 13 % y el total. Ejemplo: un café de $3.50 se cobra $3.50 (antes $3.96).
- **Motivo:** así se emiten los comprobantes en El Salvador.
- **Fase:** 5.

## D-15 · Unidades en gramos, mililitros y unidades
- **Fuentes:** los lineamientos describen la receta del Latte grande en g y ml; hoy el inventario usa kg, lt y und.
- **Decisión:** guardar en `g`, `ml` y `unidad`. El inventario mostrará, por ejemplo, 2500 g en lugar de 2.5 kg.
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
- **Fase:** 3 y 4.

## D-19 · Quién registró y versión del registro
- **Fuentes:** la clase 15 muestra en el detalle el usuario que registró, la fecha y la versión.
- **Decisión:** ventas y compras guardan quién las registró y su versión; el ticket muestra "Atendió: …". Productos e insumos usan la versión para responder 409 si alguien edita con datos viejos.
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
