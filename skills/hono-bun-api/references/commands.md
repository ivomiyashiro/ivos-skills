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
  tx: TransactionManager;
  eventBus: EventBus;
  clock: Clock;
};

export const createProjectCommand = async (
  deps: CreateProjectDeps,
  command: CreateProjectCommand,
): Promise<Result<{ id: string }, AppError>> => {
  const project = await deps.tx.run(async (db) => {
    const [project] = await db
      .insert(projects)
      .values({
        organizationId: command.organizationId,
        name: command.name,
        ownerId: command.ownerId,
        createdAt: deps.clock.now(),
      })
      .returning({ id: projects.id });

    if (!project) throw new Error('Project insert did not return a row');
    return project;
  });

  deps.eventBus.publish(projectCreated(project.id));
  return success(project);
};
```

## Responsabilidades

Un command puede:

- cargar estado necesario para la decisión
- verificar authorization fina
- aplicar helpers locales puros cuando una regla lo requiere
- abrir transacciones
- usar Drizzle y adapters explícitos
- registrar outbox/eventos
- devolver output mínimo

No debe:

- leer `Context` de Hono
- parsear JSON
- devolver status HTTP
- construir SQL de dashboards/listados
- llamar otro command de otra feature como shortcut

## Validación

Zod valida shape en el borde HTTP. El command y sus helpers locales validan reglas de negocio:

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

Para writes triviales de una sola tabla, el command recibe `db` y usa Drizzle directo.

## Eventos

Para side effects no críticos:

- command persiste cambios
- command guarda outbox o publica post-commit
- worker procesa email/webhook/notificación

No publicar eventos externos antes de confirmar la transacción.

## Testing

Testear unitariamente solo helpers puros co-localizados. Validar commands con IO en
`features/<feature>/__tests__/` mediante `app.request()` contra Postgres real de
Docker Compose, con preload, migraciones y seed; no mockear DB ni Supabase.
