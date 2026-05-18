# Template: feature slice

Esta carpeta es consumida por `scripts/scaffold-feature.ts` para generar
una nueva feature.

## Placeholders soportados

El script reemplaza estos placeholders en TODO el contenido de los `.tmpl`
y en los nombres de archivos:

| Placeholder | Significado | Ejemplo (feature = "quote") |
|---|---|---|
| `__feature__` | nombre singular, kebab-lower | `quote` |
| `__features__` | nombre plural, kebab-lower | `quotes` |
| `__Feature__` | nombre singular, PascalCase | `Quote` |
| `__Features__` | nombre plural, PascalCase | `Quotes` |
| `__FEATURE__` | nombre singular, UPPER | `QUOTE` |
| `__action__` | acción inicial (default `create-__feature__`) | `create-quote` |
| `__query__` | query inicial (default `get-__feature__-by-id`) | `get-quote-by-id` |

## Invocación

```bash
bun run scripts/scaffold-feature.ts <feature-name>
# ejemplo:
bun run scripts/scaffold-feature.ts quote
```

Flags:
- `--no-events` — omite `events.ts`.
- `--no-tests` — omite `routes.test.ts`.

## Output

Crea `src/features/<feature-plural>/` con todos los archivos renombrados.
Falla si la carpeta ya existe.

## Después de scaffold

1. Implementar la tabla en `src/shared/db/schema.ts` y generar migración.
2. Reemplazar los `throw new Error(...)` del `repository.ts` con queries reales.
3. Implementar el query handler con la query real.
4. Mountear las rutas en `src/app.ts`:
   ```ts
   app.route('/<features-plural>', build<Features>Routes(deps));
   ```
5. Borrar los `test.skip` de `routes.test.ts` y conectarlos a una DB de test.
