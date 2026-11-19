# Requisitos técnicos y dónde se cumplen

Cada requisito obligatorio de los [lineamientos](lineamientos.pdf) con ejemplos reales del código. Los enlaces llevan al archivo y la línea exacta.

> Esta tabla se generó a partir del código el 19 nov 2026. Si cambias uno de estos archivos, revisa que la línea siga siendo la correcta.

| Requisito | Archivo y línea | Qué se ve ahí |
|---|---|---|
| Let y Const | [`services/api.js:15`](../apps/frontend/src/services/api.js#L15) (frontend) | `let`: el token cambia al iniciar y cerrar sesión |
| Let y Const | [`services/api.js:63`](../apps/frontend/src/services/api.js#L63) (frontend) | `let`: la respuesta se asigna dentro del `try` |
| Let y Const | [`modules/caja/caja.service.js:43`](../apps/backend/src/modules/caja/caja.service.js#L43) (backend) | `let`: el monto se recalcula con el desglose de billetes |
| Let y Const | [`services/api.js:7`](../apps/frontend/src/services/api.js#L7) (frontend) | `const`: la URL base de la API no cambia |
| Let y Const | [`middlewares/roles.js:6`](../apps/backend/src/middlewares/roles.js#L6) (backend) | `const`: grupos de roles |
| Funciones y métodos | [`utils/iva.js:13`](../apps/frontend/src/utils/iva.js#L13) (frontend) | Función declarada que separa el IVA de una orden |
| Funciones y métodos | [`utils/iva.js:10`](../apps/frontend/src/utils/iva.js#L10) (frontend) | Función flecha |
| Funciones y métodos | [`services/api.js:25`](../apps/frontend/src/services/api.js#L25) (frontend) | Método del objeto `sesion` |
| Funciones y métodos | [`services/api.js:39`](../apps/frontend/src/services/api.js#L39) (frontend) | Clase con constructor que extiende `Error` |
| Funciones y métodos | [`modules/ventas/ventas.service.js:71`](../apps/backend/src/modules/ventas/ventas.service.js#L71) (backend) | Función asíncrona con la lógica de una venta |
| Tipos de datos: string, number, boolean, object | [`services/api.js:14`](../apps/frontend/src/services/api.js#L14) (frontend) | string |
| Tipos de datos: string, number, boolean, object | [`utils/iva.js:5`](../apps/frontend/src/utils/iva.js#L5) (frontend) | number |
| Tipos de datos: string, number, boolean, object | [`pages/Login.jsx:21`](../apps/frontend/src/pages/Login.jsx#L21) (frontend) | boolean (mostrar u ocultar la contraseña) |
| Tipos de datos: string, number, boolean, object | [`utils/permisos.js:31`](../apps/frontend/src/utils/permisos.js#L31) (frontend) | object (nombre legible de cada rol) |
| Tipos de datos: string, number, boolean, object | [`modules/auth/auth.service.js:18`](../apps/backend/src/modules/auth/auth.service.js#L18) (backend) | Validación de tipos con `typeof` en el login |
| Manejo de datos e iteradores con arreglos en React | [`components/layout/Sidebar.jsx:43`](../apps/frontend/src/components/layout/Sidebar.jsx#L43) (frontend) | `filter` + `map`: el menú muestra solo los módulos del rol |
| Manejo de datos e iteradores con arreglos en React | [`utils/iva.js:14`](../apps/frontend/src/utils/iva.js#L14) (frontend) | `reduce`: suma de la orden |
| Manejo de datos e iteradores con arreglos en React | [`context/AppContext.jsx:125`](../apps/frontend/src/context/AppContext.jsx#L125) (frontend) | `find`: la sucursal activa |
| Manejo de datos e iteradores con arreglos en React | [`pages/Administracion.jsx:38`](../apps/frontend/src/pages/Administracion.jsx#L38) (frontend) | `filter`: usuarios activos |
| Manejo de datos e iteradores con arreglos en React | [`pages/Administracion.jsx:307`](../apps/frontend/src/pages/Administracion.jsx#L307) (frontend) | `some`: hay filtros activos en la bitácora |
| Datos manejados en estructuras con arreglos | [`components/layout/Sidebar.jsx:11`](../apps/frontend/src/components/layout/Sidebar.jsx#L11) (frontend) | Arreglo de objetos: módulos del sistema |
| Datos manejados en estructuras con arreglos | [`components/layout/Layout.jsx:11`](../apps/frontend/src/components/layout/Layout.jsx#L11) (frontend) | Arreglo de objetos: pasos de un turno por rol |
| Datos manejados en estructuras con arreglos | [`utils/permisos.js:6`](../apps/frontend/src/utils/permisos.js#L6) (frontend) | Arreglo de strings: roles |
| Datos manejados en estructuras con arreglos | [`utils/planilla.js:17`](../apps/backend/src/utils/planilla.js#L17) (backend) | Arreglo de objetos: tabla de retención de renta |
| Hooks de React (useState, useEffect, entre otros) | [`context/AuthContext.jsx:15`](../apps/frontend/src/context/AuthContext.jsx#L15) (frontend) | `useState` |
| Hooks de React (useState, useEffect, entre otros) | [`context/AuthContext.jsx:19`](../apps/frontend/src/context/AuthContext.jsx#L19) (frontend) | `useEffect`: confirma la sesión al abrir la app |
| Hooks de React (useState, useEffect, entre otros) | [`context/AuthContext.jsx:42`](../apps/frontend/src/context/AuthContext.jsx#L42) (frontend) | `useCallback` |
| Hooks de React (useState, useEffect, entre otros) | [`context/AuthContext.jsx:56`](../apps/frontend/src/context/AuthContext.jsx#L56) (frontend) | `useMemo` |
| Hooks de React (useState, useEffect, entre otros) | [`context/AuthContext.jsx:74`](../apps/frontend/src/context/AuthContext.jsx#L74) (frontend) | `useContext` (hook propio `useAuth`) |
| Hooks de React (useState, useEffect, entre otros) | [`components/layout/Topbar.jsx:14`](../apps/frontend/src/components/layout/Topbar.jsx#L14) (frontend) | `useRef`: cerrar menús al hacer clic fuera |
| Hooks de React (useState, useEffect, entre otros) | [`hooks/useFetch.js:8`](../apps/frontend/src/hooks/useFetch.js#L8) (frontend) | Hook propio que pide datos a la API |
| Componentes de React con Tailwind | [`components/ui/index.jsx:15`](../apps/frontend/src/components/ui/index.jsx#L15) (frontend) | Componente reutilizable con variantes de Tailwind |
| Componentes de React con Tailwind | [`components/ui/index.jsx:108`](../apps/frontend/src/components/ui/index.jsx#L108) (frontend) | Modal accesible (Escape, foco) |
| Componentes de React con Tailwind | [`pages/Login.jsx:14`](../apps/frontend/src/pages/Login.jsx#L14) (frontend) | Página de inicio de sesión |
| Componentes de React con Tailwind | [`components/layout/Sidebar.jsx:27`](../apps/frontend/src/components/layout/Sidebar.jsx#L27) (frontend) | Menú lateral |
| Enrutadores en React | [`routes/AppRouter.jsx:56`](../apps/frontend/src/routes/AppRouter.jsx#L56) (frontend) | React Router 7 |
| Enrutadores en React | [`routes/AppRouter.jsx:40`](../apps/frontend/src/routes/AppRouter.jsx#L40) (frontend) | Ruta protegida: sin sesión lleva al login |
| Enrutadores en React | [`routes/AppRouter.jsx:49`](../apps/frontend/src/routes/AppRouter.jsx#L49) (frontend) | Ruta protegida por rol |
| Enrutadores en React | [`routes/AppRouter.jsx:9`](../apps/frontend/src/routes/AppRouter.jsx#L9) (frontend) | Carga de páginas bajo demanda |
| Enrutadores en React | [`components/layout/Sidebar.jsx:44`](../apps/frontend/src/components/layout/Sidebar.jsx#L44) (frontend) | Enlaces del menú con la ruta activa resaltada |
| Promesas y programación asíncrona entre la API y el frontend | [`services/api.js:58`](../apps/frontend/src/services/api.js#L58) (frontend) | `async` / `await fetch(…)` |
| Promesas y programación asíncrona entre la API y el frontend | [`context/AuthContext.jsx:43`](../apps/frontend/src/context/AuthContext.jsx#L43) (frontend) | `await` del login |
| Promesas y programación asíncrona entre la API y el frontend | [`services/index.js:6`](../apps/frontend/src/services/index.js#L6) (frontend) | Cada servicio devuelve una promesa |
| Uso correcto del patrón REST | [`modules/productos/productos.routes.js:10`](../apps/backend/src/modules/productos/productos.routes.js#L10) (backend) | GET lista un recurso en plural |
| Uso correcto del patrón REST | [`modules/productos/productos.routes.js:12`](../apps/backend/src/modules/productos/productos.routes.js#L12) (backend) | POST crea |
| Uso correcto del patrón REST | [`modules/productos/productos.routes.js:13`](../apps/backend/src/modules/productos/productos.routes.js#L13) (backend) | PUT actualiza |
| Uso correcto del patrón REST | [`modules/productos/productos.routes.js:14`](../apps/backend/src/modules/productos/productos.routes.js#L14) (backend) | DELETE desactiva |
| Uso correcto del patrón REST | [`modules/ventas/ventas.routes.js:17`](../apps/backend/src/modules/ventas/ventas.routes.js#L17) (backend) | PATCH: acción sobre un recurso |
| Uso correcto del protocolo HTTP | [`modules/ventas/ventas.controller.js:7`](../apps/backend/src/modules/ventas/ventas.controller.js#L7) (backend) | 201 Created con el encabezado Location |
| Uso correcto del protocolo HTTP | [`middlewares/auth.js:13`](../apps/backend/src/middlewares/auth.js#L13) (backend) | 401 sin token |
| Uso correcto del protocolo HTTP | [`middlewares/roles.js:17`](../apps/backend/src/middlewares/roles.js#L17) (backend) | 403 sin permiso |
| Uso correcto del protocolo HTTP | [`middlewares/validate.js:12`](../apps/backend/src/middlewares/validate.js#L12) (backend) | 400 si falta un campo |
| Uso correcto del protocolo HTTP | [`utils/AppError.js:14`](../apps/backend/src/utils/AppError.js#L14) (backend) | 409 por versión vieja |
| Uso correcto del protocolo HTTP | [`services/api.js:61`](../apps/frontend/src/services/api.js#L61) (frontend) | Encabezado Authorization: Bearer |
| Buen diseño visual y experiencia de usuario | [`index.css:9`](../apps/frontend/src/index.css#L9) (frontend) | Colores de la marca como variables (se cambian en Identidad Visual) |
| Buen diseño visual y experiencia de usuario | [`components/decor/Decor.jsx:161`](../apps/frontend/src/components/decor/Decor.jsx#L161) (frontend) | Ilustraciones mayas propias en SVG |
| Buen diseño visual y experiencia de usuario | [`components/ui/index.jsx:165`](../apps/frontend/src/components/ui/index.jsx#L165) (frontend) | Estados de carga, error y vacío en cada vista |
| Buen diseño visual y experiencia de usuario | [`components/ui/index.jsx:227`](../apps/frontend/src/components/ui/index.jsx#L227) (frontend) | Avisos de éxito y error |
| Buen diseño visual y experiencia de usuario | [`components/layout/Sidebar.jsx:36`](../apps/frontend/src/components/layout/Sidebar.jsx#L36) (frontend) | Menú compacto en pantallas bajas, sin scroll |
| Uso correcto de promesas en cualquiera de sus formas | [`context/AuthContext.jsx:24`](../apps/frontend/src/context/AuthContext.jsx#L24) (frontend) | `.then` |
| Uso correcto de promesas en cualquiera de sus formas | [`context/AuthContext.jsx:26`](../apps/frontend/src/context/AuthContext.jsx#L26) (frontend) | `.catch` |
| Uso correcto de promesas en cualquiera de sus formas | [`context/AuthContext.jsx:27`](../apps/frontend/src/context/AuthContext.jsx#L27) (frontend) | `.finally` |
| Uso correcto de promesas en cualquiera de sus formas | [`modules/productos/productos.service.js:58`](../apps/backend/src/modules/productos/productos.service.js#L58) (backend) | `Promise.all`: dos consultas a la vez |
| Uso correcto de promesas en cualquiera de sus formas | [`middlewares/bitacora.js:49`](../apps/backend/src/middlewares/bitacora.js#L49) (backend) | La respuesta se envía cuando termina la bitácora |
| Sentencias try/catch y manejo de errores | [`services/api.js:71`](../apps/frontend/src/services/api.js#L71) (frontend) | `try/catch` alrededor de `fetch` |
| Sentencias try/catch y manejo de errores | [`pages/Login.jsx:38`](../apps/frontend/src/pages/Login.jsx#L38) (frontend) | `try/catch` al iniciar sesión: el error se muestra en pantalla |
| Sentencias try/catch y manejo de errores | [`config/database.js:55`](../apps/backend/src/config/database.js#L55) (backend) | `try/catch` en las transacciones: `rollback` si algo falla |
| Sentencias try/catch y manejo de errores | [`middlewares/errorHandler.js:25`](../apps/backend/src/middlewares/errorHandler.js#L25) (backend) | Manejador central: mensajes genéricos, nunca el error de la base |
| Sentencias try/catch y manejo de errores | [`modules/bitacora/bitacora.service.js:31`](../apps/backend/src/modules/bitacora/bitacora.service.js#L31) (backend) | Un fallo de la bitácora no rompe la operación |

## Además de los requisitos

| Tema | Dónde |
|---|---|
| SQL en minúsculas y parametrizado, solo en repositorios | `apps/backend/src/modules/*/*.repository.js` |
| Transacciones (`begin`, `commit`, `rollback`) | `withTransaction` en `apps/backend/src/config/database.js`; ventas, compras, caja, inventario y planilla |
| Seguridad: bcrypt, JWT, roles, helmet, límites | [Manual técnico, sección 1.3](manual-tecnico/README.md#13-seguridad) |
| Pruebas automáticas (75) | `apps/backend/tests` (`npm test`) y la [colección de Postman](postman/origenes-sv.postman_collection.json) |
| Despliegue con NginX y HTTPS | [`deploy/nginx.conf`](../deploy/nginx.conf) |
