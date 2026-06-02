# Commands

Los commands modifican estado. Cada command representa un caso de uso nombrado con
verbo e intencion de negocio: `CreateProjectCommand`, `InviteMemberCommand`,
`CancelSubscriptionCommand`.

## Ubicacion

```txt
modules/projects/application/
  commands/create-project.command.ts
  handlers/create-project.handler.ts
```

## Forma Recomendada

```ts
export type CreateProjectCommand = {
  organizationId: string;
  name: string;
  ownerId: string;
};

export type CreateProjectDeps = {
  projectRepo: ProjectRepository;
  organizationRepo: OrganizationRepository;
  tx: TransactionManager;
  eventBus: EventBus;
  clock: Clock;
  logger: Logger;
};

export const createProjectHandler = async (
  deps: CreateProjectDeps,
  command: CreateProjectCommand,
): Promise<Result<{ id: string }, AppError>> => {
  return deps.tx.run(async () => {
    const org = await deps.organizationRepo.findById(command.organizationId);
    if (!org) return failure(notFound('Organization', command.organizationId));

    if (!org.canCreateProject(command.ownerId)) {
      return failure(forbidden('not allowed to create project'));
    }

    const project = Project.create({
      organizationId: command.organizationId,
      name: command.name,
      ownerId: command.ownerId,
      now: deps.clock.now(),
    });

    await deps.projectRepo.save(project);
    await deps.eventBus.publish(project.pullEvents());

    deps.logger.info({ projectId: project.id }, 'project created');
    return success({ id: project.id });
  });
};
```

## Responsabilidades

Un command handler puede:
- cargar agregados necesarios para la decision
- verificar authorization fina
- aplicar policies de dominio
- abrir transacciones
- llamar repositorios/adapters
- registrar outbox/domain events
- devolver output minimo

No debe:
- leer `Context` de Hono
- parsear JSON
- devolver status HTTP
- construir SQL de dashboards/listados
- llamar otro command handler de otro modulo como shortcut

## Validacion

Zod valida shape en el borde HTTP. El command/domain valida reglas de negocio:
- limites del plan
- permisos del actor
- estado actual del agregado
- unicidad semantica
- transiciones permitidas

## Transacciones

Usar `TransactionManager` cuando:
- se escriben multiples tablas
- se guarda entidad + outbox
- se mutan multiples agregados
- hay que garantizar rollback atomico

Para writes triviales de una sola tabla, el repo puede usar `db` directo.

## Eventos

Para side effects no criticos:
- dominio acumula eventos
- command persiste cambios
- command guarda outbox o publica post-commit
- worker procesa email/webhook/notificacion

No publicar eventos externos antes de confirmar la transaccion.

## Testing

Unit testear command handlers con repositorios fake. Integration testear repositorios
Drizzle contra DB real o pglite/testcontainers.
