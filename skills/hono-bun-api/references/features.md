# Features

Una feature agrupa endpoints, casos de uso, persistencia y helpers locales de una
area del producto. Es una vertical slice: todo lo que cambia junto debe vivir junto.

## Estructura

```txt
features/projects/
  controller/
    projects.controller.ts
  routes/
    projects.routes.ts
    projects.routes.test.ts
  repository/
    project.repository.ts
    drizzle-project.repository.ts
    project-read-model.ts
    project.mapper.ts
  utils/
    project.entity.ts
    project.policies.ts
    project.events.ts
  use-cases/
    commands/
      create-project.command.ts
      update-project.command.ts
    queries/
      get-project-by-id.query.ts
      list-projects.query.ts
  projects.constants.ts
  projects.schemas.ts
  projects.types.ts
  index.ts
```

## Naming

- feature folder en plural: `projects`, `organizations`, `billing`
- entidad/modelo liviano en singular: `project.entity.ts`
- routes/controller en plural: `projects.routes.ts`, `projects.controller.ts`
- command: `create-project.command.ts` exporta `createProjectCommand`
- query: `list-projects.query.ts` exporta `listProjectsQuery`
- repository: `project.repository.ts` para contrato, `drizzle-project.repository.ts` para implementación
- read model: `project-read-model.ts`

## Boundaries

Una feature puede importar `shared/*`. No debe importar archivos internos de otra
feature. Si hace falta leer datos de otra feature, usar SQL/read-side. Si hace falta
reaccionar a cambios, usar eventos. Si hace falta reutilizar una regla compleja, la
feature dueña debe exponer una API pública desde su `index.ts` o la regla debe subir
a `shared` solo si es realmente transversal.

El skeleton incluye `bun run check:boundaries` para detectar imports internos entre
features y cualquier import desde `shared` hacia `features`.

## Types, Constants, Utils

- `projects.schemas.ts`: schemas HTTP y tipos inferidos desde Zod.
- `projects.types.ts`: tipos propios que no salen de Zod.
- `projects.constants.ts`: estados, límites y defaults locales.
- `utils/`: helpers puros locales, policies, entidades livianas, guards y mappers sin IO.
- `shared/types` o `shared/utils`: solo cuando dos o más features lo necesitan de verdad.

## Cuándo Dividir Una Feature

Dividir cuando:

- los conceptos tienen reglas y vocabulario distintos
- la feature tiene demasiados casos de uso no relacionados
- permisos/ownership/lifecycle cambian
- hay presión real para extraer o escalar separado

No dividir solo para "ordenar carpetas". Primero ordenar por casos de uso y naming.
