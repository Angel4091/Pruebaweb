# Declaración de uso de inteligencia artificial

Los lineamientos piden declarar cualquier uso de IA en la bibliografía y que todo el equipo entienda cada parte de la solución. Este documento dice qué se hizo con IA, qué hizo el equipo, cómo se verificó el resultado y cómo citarlo en el informe IEEE.

## Herramienta

| | |
|---|---|
| Herramienta | **Claude Code**, de Anthropic, en la aplicación de escritorio |
| Modelo | **Claude Opus 5.5** |
| Periodo | Del 15 al 19 de noviembre de 2026 |
| Alcance | Los 150 commits del repositorio hasta la Fase 6 llevan la línea `Co-Authored-By: Claude Opus 5.5`: la IA participó en todo el proyecto |

## Qué hizo la IA

La IA escribió el código, las pruebas y la documentación, siguiendo las instrucciones del equipo y este orden de prioridad: los lineamientos, después las clases y al final las indicaciones del equipo. Cuando dos fuentes chocaban, lo anotó en [`decisiones.md`](decisiones.md).

| Área | Qué produjo |
|---|---|
| Base de datos | `database/schema.sql` (27 tablas, reglas y índices), los datos de demo y los scripts `db:init` y `db:seed` |
| Backend | Los 12 módulos de Express (rutas, controladores, servicios y repositorios), la seguridad (bcrypt, JWT, roles, helmet, límites), la bitácora y la paginación |
| Frontend | Las pantallas en React con Tailwind, los componentes, el inicio de sesión, el menú por rol, Administración y las ilustraciones vectoriales (templo, greca, quetzal) escritas como código SVG |
| Pruebas | Las 75 pruebas con `node:test` y la colección de Postman |
| Despliegue | `deploy/nginx.conf`, el servicio de systemd y la sección de HTTPS del README |
| Documentación | El README, los manuales, la guía de la API, los endpoints, la arquitectura, los requisitos técnicos, la guía de defensa y este documento |

**Lo que no se hizo con IA:** las fotografías de platillos e insumos son de Wikimedia Commons, con sus licencias ([`creditos-imagenes.md`](creditos-imagenes.md)), y el logo es del equipo.

## Qué hizo el equipo

- Eligió el caso de negocio y entregó los lineamientos y las transcripciones de las clases.
- Fijó las reglas de trabajo: solo las tecnologías permitidas, SQL parametrizado, Gitflow, nada de secretos en el repositorio, y no subir ni unir ramas sin su permiso.
- Decidió el rumbo del diseño (la identidad maya y mantener el diseño de las pantallas) y aprobó cada fase antes de empezarla.
- Revisó los resultados de cada fase y autorizó cada `push`.

## Cómo se verificó lo que hizo la IA

Nada se dio por bueno sin probarlo:

- **Pruebas automáticas:** `npm test` corre 75 pruebas contra una base separada. Cubren IVA, recetas, correlativos, transacciones, planilla, login, tokens, roles, sucursales, bitácora y paginación.
- **Colección de Postman:** 42 pruebas de punta a punta contra la API.
- **Navegador:** cada fase se revisó con cada rol (admin, gerente, cajero, barista), con una venta completa que descuenta la receta del Latte grande.
- **Clon limpio:** al cerrar cada fase se clonó el repositorio en una carpeta nueva y se instaló, se probó y se compiló desde cero.
- **Despliegue:** NginX se probó en Docker con 21 comprobaciones de TLS, encabezados y proxy, y se revisó la política de contenido (CSP) en las 9 pantallas.

## Errores que se encontraron al revisar

La IA también se equivoca. Estos son ejemplos de errores que salieron en las pruebas y se corrigieron:

| Qué estaba mal | Cómo se detectó | Arreglo |
|---|---|---|
| El IVA se sumaba encima del precio del menú | Revisión contra los lineamientos | Precios con IVA incluido (D-14) |
| Un campo faltante respondía 422 en lugar de 400 | Colección de Postman | D-32 |
| Las compras de demo no guardaban el nombre del proveedor | Revisión del historial en el navegador | Corrección en el seed |
| Al menú del admin le faltaban 7 px en pantallas de 761 px | Medición en el navegador | El menú compacto empieza en 780 px (D-18) |
| Al cerrar sesión, el siguiente usuario caía en la pantalla del anterior | Prueba con varios roles | Login limpio al salir (D-29) |

## Lo que todavía le toca al equipo

1. **Entender cada parte.** Los lineamientos anulan la evaluación de quien no pueda explicar su parte. La [guía de defensa](guia-defensa.md) dice qué archivos estudiar según el ticket de cada integrante y trae las preguntas probables con su respuesta.
2. **Commits de cada integrante.** Hoy todos los commits están hechos con un solo usuario. D-17 pide que cada integrante revise y haga los commits y el pull request de sus tickets con su propio usuario de GitHub.
3. **Declararlo en el informe IEEE** con las referencias de abajo.

## Cómo citarlo en el informe IEEE

En la sección de metodología, una frase como:

> El código, las pruebas y la documentación del sistema se desarrollaron con apoyo del asistente de programación Claude Code (modelo Claude Opus 5.5) [1]. El equipo definió los requisitos y las reglas de trabajo, revisó y aprobó cada fase y verificó el resultado con pruebas automáticas, pruebas manuales por rol y pruebas de despliegue.

Y en las referencias:

> [1] Anthropic, "Claude Code," asistente de programación con IA, modelo Claude Opus 5.5, 2026. [En línea]. Disponible: https://claude.com/claude-code. [Accedido: 19 nov. 2026].
>
> [2] Anthropic, "Claude Opus 5.5," modelo de lenguaje, 2026. [En línea]. Disponible: https://www.anthropic.com/claude. [Accedido: 19 nov. 2026].
