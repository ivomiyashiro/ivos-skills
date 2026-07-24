# Features

Una feature agrupa endpoints, operaciones, contratos y tests de un area del
producto. Es una vertical slice plana: todo lo que cambia junto debe vivir junto.

## Estructura

```txt
features/projects/
  use-cases/
    commands/
      create-project.command.ts
      update-project.command.ts
    queries/
      get-project-by-id.query.ts
      list-projects.query.ts
  __tests__/
    projects.integration.ts
  projects.constants.ts
  projects.errors.ts
  projects.events.ts
  projects.routes.ts
  projects.schemas.ts
  projects.types.ts
  index.ts
```

## Naming

- feature folder en plural: `projects`, `organizations`, `billing`
- routes en plural: `projects.routes.ts`
- command: `create-project.command.ts` exporta `createProjectCommand`
- query: `list-projects.query.ts` exporta `listProjectsQuery`
- cada operación exporta `<verb><Noun>Command` o `<verb><Noun>Query`
- un query reutilizado por un command permanece en `use-cases/queries/`

## Boundaries

Una feature puede importar `shared/*`. No debe importar archivos internos de otra
feature. Si hace falta leer datos de otra feature, usar SQL/read-side. Si hace falta
reaccionar a cambios, usar eventos. Si hace falta reutilizar una regla compleja, la
feature dueña debe exponer una API pública desde su `index.ts` o la regla debe subir
a `shared` solo si es realmente transversal.

El skeleton incluye `bun run check:boundaries` para detectar imports internos entre
features y cualquier import desde `shared` hacia `features`.

## Contratos Y Extracciones

- `projects.schemas.ts`: schemas HTTP y tipos inferidos desde Zod.
- `projects.types.ts`: tipos propios que no salen de Zod.
- `projects.errors.ts`: errores esperados propios de la feature.
- `projects.events.ts`: contratos de eventos locales.
- `projects.constants.ts`: estados, límites y defaults locales.
- Commands y queries reciben deps explícitas y usan Drizzle directo por default.
- El mapping de row a DTO vive en la operación dueña.
- Extraer un helper local o repository solo ante complejidad concreta o reutilización dentro de la feature; no crear sus carpetas por default.
- `shared/types` o `shared/utils`: solo cuando dos o más features lo necesitan de verdad.

## Cuándo Dividir Una Feature

Dividir cuando:

- los conceptos tienen reglas y vocabulario distintos
- la feature tiene demasiados casos de uso no relacionados
- permisos/ownership/lifecycle cambian
- hay presión real para extraer o escalar separado

No dividir solo para "ordenar carpetas". Primero ordenar por casos de uso y naming.
