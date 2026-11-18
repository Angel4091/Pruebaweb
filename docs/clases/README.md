# Material de clase

Transcripciones y resúmenes de las sesiones de solución técnica de Programación Web (docente: Rony Remberto Santos Bautista, DEI). El caso que se resuelve en clase es otro (órdenes de servicio de TechService); aquí se usan como referencia técnica para el caso de Orígenes SV.

Los lineamientos del proyecto están en [`../lineamientos.pdf`](../lineamientos.pdf). Cuando una clase y los lineamientos no coinciden, se siguen los lineamientos; cada diferencia queda en [`../decisiones.md`](../decisiones.md).

| # | Archivo | Fecha | Temas |
|---|---|---|---|
| 01 | [arquitectura-monolitica-y-distribuida](01-arquitectura-monolitica-y-distribuida.pdf) | 2 nov | NginX como proxy inverso, IP y puertos, monolito vs. arquitectura distribuida, API Gateway como guardián de acceso |
| 02 | [caso-techservice-y-gitflow](02-caso-techservice-y-gitflow.pdf) | 2 nov | Gitflow (main, develop, `feature/<nombre>/<ticket>`, bugfix), requisitos del caso: JWT, roles, SQL parametrizado, capas route → middleware → controller → service → repository |
| 03 | [estructura-del-proyecto-y-pull-requests](03-estructura-del-proyecto-y-pull-requests.pdf) | 2 nov | Carpetas `apps/`, `database/` y `scripts/`, `"type": "module"`, una rama y un PR por parte del proyecto |
| 04 | [scripts-variables-de-entorno-y-base-de-datos](04-scripts-variables-de-entorno-y-base-de-datos.pdf) | 3 nov | Scripts `dev`, `build`, `start`, `db:init`; `.env` del backend; CORS; `JWT_SECRET` generado con openssl y distinto por ambiente; tabla de API keys e índices |
| 05 | [esquema-relacional-e-indices](05-esquema-relacional-e-indices.pdf) | 3 nov | Tablas con `check`, llaves foráneas, `lower(email)` único, historial de cambios, bitácora e índices |
| 06 | [conexion-postgresql-y-db-init](06-conexion-postgresql-y-db-init.pdf) | 7 nov | Dependencias (`pg`, `cors`, `dotenv`, `express-rate-limit`, `helmet`, `bcryptjs`, `jsonwebtoken`), pool de conexiones con SSL, script `db:init` |
| 07 | [kanban-scrum-y-seed](07-kanban-scrum-y-seed.pdf) | 7 nov | Kanban y Scrum, roles del equipo, seed con `SEED_PASSWORD` de 12 caracteres o más y bcrypt, `on conflict`, transacciones |
| 08 | [middlewares-y-servidor-express](08-middlewares-y-servidor-express.pdf) | 8 nov | Middleware de autenticación (Bearer, 401), roles (403), manejador de errores genérico, `helmet`, `express.json` de 100 kb, `/health`, `app.js` separado de `server.js` |
| 09 | [modulo-auth-con-jwt](09-modulo-auth-con-jwt.pdf) | 8 nov | Módulo auth: repository, service y controller; login con bcrypt; JWT con `sub`, issuer, audience, HS256 y expiración; ruta `me` |
| 10 | [pruebas-de-jwt-en-postman](10-pruebas-de-jwt-en-postman.pdf) | 8 nov | Pruebas con Postman, token vencido o alterado, carpeta `modules/` |
| 11 | [modulo-de-clientes-e-intro-a-php](11-modulo-de-clientes-e-intro-a-php.pdf) | 8 nov | CRUD de clientes por capas, filtros por query (`?active=true`), introducción a PHP |
| 12 | [api-gateway-en-php](12-api-gateway-en-php.pdf) | 9 nov | API Gateway en PHP con API key, proxy inverso, un commit por módulo |
| 13 | [resumen-http-y-https](13-resumen-http-y-https.pdf) | — | HTTP vs. HTTPS, puertos 80 y 443, TLS, certificados, Diffie-Hellman, AES |
| 14 | [resumen-http-y-https-parte-2](14-resumen-http-y-https-parte-2.pdf) | — | Endpoints, token Bearer, 401 vs. 403, HTTPS no reemplaza la autorización |
| 15 | [guia-arquitectura-frontend-y-api-keys](15-guia-arquitectura-frontend-y-api-keys.pdf) | — | Monolito en capas, desarrollo iterativo, diseño propio frente a plantillas, CRUD con filtros, versión del registro, API keys y herramientas de administración |

Los archivos 13 a 15 son resúmenes hechos a partir de las grabaciones; corrigen algunas imprecisiones del audio (PUT vs. POST, SSL vs. TLS, 401 vs. 403).
