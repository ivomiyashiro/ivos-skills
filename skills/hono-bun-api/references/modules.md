# Modules

Un modulo agrupa endpoints, casos de uso, dominio e infraestructura de una area del
producto.

## Estructura

```txt
modules/projects/
  projects.routes.ts
  projects.controller.ts
  projects.schemas.ts
  projects.types.ts
  projects.routes.test.ts

  application/
    commands/
    queries/
    handlers/
    services/

  domain/
    project.entity.ts
    project.repository.ts
    project.errors.ts
    project.policies.ts
    project.events.ts

  infrastructure/
    drizzle-project.repository.ts
    project.mapper.ts
    project-read-model.ts
```

## Naming

- modulo plural: `projects`, `organizations`, `billing`
- entity singular: `project.entity.ts`
- commands: `create-project.command.ts`
- handlers: `create-project.handler.ts`
- routes/controller plural: `projects.routes.ts`, `projects.controller.ts`

## Boundaries

Un modulo puede importar `shared/*`. No debe importar internals de otro modulo.
Si hace falta leer datos de otro modulo, usar SQL read-side. Si hace falta reaccionar
a cambios, usar eventos.

## Cuándo Dividir Un Modulo

Dividir cuando:
- los conceptos tienen reglas y vocabulario distintos
- el modulo tiene demasiados handlers no relacionados
- los permisos/ownership cambian
- hay presion para escalar o desplegar separado

No dividir solo para "ordenar carpetas".
