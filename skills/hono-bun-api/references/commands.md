# Commands

Los commands modifican estado. Cada command representa un caso de uso nombrado con
verbo e intención de negocio: `createProjectCommand`, `inviteMemberCommand`,
`cancelSubscriptionCommand`.

## Ubicación

```txt
features/projects/use-cases/commands/
  create-project.command.ts
  update-project.command.ts
```

## Forma Recomendada

```ts
export type CreateProjectCommand = {
  organizationId: string;
  name: string;
  ownerId: string;
};

export type CreateProjectDeps = {
  createProjectRepository: (db: Db) => ProjectRepository;
  tx: TransactionManager;
  eventBus: EventBus;
  clock: Clock;
  logger: Logger;
};

export const createProjectCommand = async (
  deps: CreateProjectDeps,
  command: CreateProjectCommand,
): Promise<Result<{ id: string }, AppError>> => {
  return deps.tx.run(async (db) => {
    const repo = deps.createProjectRepository(db);
    const project = Project.create({
      organizationId: command.organizationId,
      name: command.name,
      ownerId: command.ownerId,
      now: deps.clock.now(),
    });

    await repo.save(project);
    deps.eventBus.publishMany(project.pullEvents());

    deps.logger.info({ projectId: project.id }, 'project created');
    return success({ id: project.id });
  });
};
```

## Responsabilidades

Un command puede:

- cargar estado necesario para la decisión
- verificar authorization fina
- aplicar policies de `utils/`
- abrir transacciones
- llamar repositories/adapters
- registrar outbox/eventos
- devolver output mínimo

No debe:

- leer `Context` de Hono
- parsear JSON
- devolver status HTTP
- construir SQL de dashboards/listados
- llamar otro command de otra feature como shortcut

## Validación

Zod valida shape en el borde HTTP. El command/utils valida reglas de negocio:

- límites del plan
- permisos del actor
- estado actual de la entidad/agregado
- unicidad semántica
- transiciones permitidas

## Transacciones

Usar `TransactionManager` cuando:

- se escriben múltiples tablas
- se guarda entidad + outbox
- se mutan múltiples agregados
- hay que garantizar rollback atómico

Para writes triviales de una sola tabla, el repository puede usar `db` directo.

## Eventos

Para side effects no críticos:

- utils/entity acumula eventos si aplica
- command persiste cambios
- command guarda outbox o publica post-commit
- worker procesa email/webhook/notificación

No publicar eventos externos antes de confirmar la transacción.

## Testing

Unit testear commands con repositorios fake. Integration testear repositories Drizzle
contra DB real o pglite/testcontainers.
