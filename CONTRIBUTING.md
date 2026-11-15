# Guía de contribución (Gitflow)

## Ramas
- `main`: solo versiones estables. Nadie hace push directo.
- `develop`: integración. Se entra por Pull Request.
- `feature/<modulo>-<descripcion>`: se crea desde `develop` y vuelve a `develop` por PR.
- `release/<version>`: preparación de entrega; sale de `develop`, se mergea a `main` y `develop`.
- `hotfix/<descripcion>`: correcciones urgentes; sale de `main`, se mergea a `main` y `develop`.

## Flujo diario
```bash
git checkout develop && git pull origin develop
git checkout -b feature/pos-toma-pedidos
# ... trabajar ...
git add . && git commit -m "✨ feat: Agrega la toma de pedidos en el POS"
git push -u origin feature/pos-toma-pedidos
# Abrir Pull Request hacia develop y pedir revisión
```

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
- Todo PR necesita al menos 1 revisión antes del merge.
- Nunca subir `.env` ni credenciales.
