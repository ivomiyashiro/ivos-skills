# Domain Events Y Outbox

Usar eventos para comunicar hechos entre features y para disparar side effects sin
acoplar commands a proveedores externos.

## Domain Event

```ts
export type DomainEvent<TType extends string = string, TPayload = unknown> = {
  id: string;
  type: TType;
  payload: TPayload;
  occurredAt: Date;
};
```

Eventos nombran hechos pasados:
- `ProjectCreated`
- `MemberInvited`
- `SubscriptionCancelled`

No nombrar eventos como comandos (`SendEmail`, `SyncStripe`).

## En Utils/Entidades

Entities pueden acumular eventos:

```ts
export class Project {
  private events: DomainEvent[] = [];

  static create(input: CreateProjectInput) {
    const project = new Project(...);
    project.events.push({
      id: crypto.randomUUID(),
      type: 'ProjectCreated',
      payload: { projectId: project.id },
      occurredAt: input.now,
    });
    return project;
  }

  pullEvents() {
    const events = this.events;
    this.events = [];
    return events;
  }
}
```

## Publicacion Post-Commit

Para eventos in-process no durables:

```ts
const events: DomainEvent[] = [];

await tx.run(async () => {
  await repo.save(project);
  events.push(...project.pullEvents());
});

eventBus.publishMany(events);
```

No publicar dentro de una transaccion que puede hacer rollback.

## Outbox

Para emails, webhooks, notificaciones, analytics o brokers externos, preferir outbox.
Guardar evento en la misma transaccion que el cambio de dominio:

```ts
await tx.run(async (db) => {
  await projectRepo.save(project);
  await outbox.add(db, project.pullEvents());
});
```

Un worker separado procesa `outbox_events`, reintenta y marca como procesado.

Ver `references/outbox.md` para el esquema recomendado.

## Anti-Patrones

- side effects externos dentro del request critico sin retry
- publicar evento antes de persistir
- eventos con payloads enormes
- ciclos entre features por eventos
- depender del orden de handlers de eventos
