# Guía de contribución (Gitflow)

## Ramas
- `main`: versión estable y entregable. Está protegida: nadie hace push directo y solo recibe el pull request de `develop` cuando una fase quedó probada.
- `develop`: integración. Solo se entra por pull request.
- `feature/<nombre>/<ticket>`: una rama por ticket, creada desde `develop`. Ejemplo: `feature/angel/OP-000`.
- `bugfix/<nombre>/<ticket>`: corrige un error de un ticket ya integrado; sale de `develop` y vuelve a `develop`.
- `hotfix/<descripcion>`: corrección urgente en `main`; vuelve a `main` y a `develop`.

`<nombre>` es tu nombre en minúsculas y sin tildes. `<ticket>` es el código del ticket en [`docs/seguimiento/seguimiento.csv`](docs/seguimiento/seguimiento.csv):

| Prefijo | Área |
|---|---|
| `DB` | Base de datos |
| `BE` | Backend |
| `FE` | Frontend |
| `QA` | Pruebas |
| `OP` | Estructura, scripts y despliegue |
| `DOC` | Documentación |

## Flujo de un ticket
```bash
git switch develop && git pull origin develop
git switch -c feature/<nombre>/<ticket>
# ... trabajar en commits pequeños ...
git add <archivos> && git commit -m "✨ feat: Agrega el login con JWT"
git push -u origin feature/<nombre>/<ticket>
# Abrir un pull request hacia develop y pedir revisión
```

1. Un pull request por ticket. El título lleva el código del ticket y la descripción dice qué cambia y cómo se probó.
2. Antes de pedir revisión, corre `npm test` y haz una venta completa en el POS.
3. Otro integrante revisa y aprueba; el autor hace el merge.
4. Después del merge, los demás traen los cambios a su rama: `git pull origin develop`.
5. La rama integrada se borra en GitHub y en tu equipo.
6. Actualiza el estado del ticket en el seguimiento.

## Formato de commits
Estructura: `[gitmoji] [prefijo]: descripción`

- La descripción es corta, inicia con un verbo en tercera persona (Agrega, Corrige, Actualiza, Elimina) y no lleva punto final.
- Un commit por cada cambio; commits pequeños y frecuentes.

| Gitmoji | Prefijo | Uso |
|---|---|---|
| ✨ | `feat` | Nueva funcionalidad |
| 🐛 | `fix` | Corrección de errores |
| 📝 | `docs` | Documentación |
| ♻️ | `refactor` | Reorganizar código sin cambiar lo que hace |
| ✅ | `test` | Pruebas |
| 💄 | `style` | Formato o estilos |
| 🔧 | `chore` | Configuración y tareas varias |

Ejemplos:
```
✨ feat: Agrega la toma de pedidos en el POS
🐛 fix: Corrige el cálculo del IVA en el CCF
📝 docs: Actualiza el manual de usuario del módulo de caja
```

## Reglas
- Revisen que `git config user.name` y `git config user.email` sean los de su cuenta de GitHub: los commits de cada uno cuentan para la nota.
- Cada integrante hace los commits y el pull request de sus propios tickets.
- Todo PR necesita al menos 1 revisión antes del merge.
- Nunca subir `.env` ni credenciales.
- Si dos fuentes piden cosas distintas, se decide según [`docs/decisiones.md`](docs/decisiones.md) y se anota ahí.
