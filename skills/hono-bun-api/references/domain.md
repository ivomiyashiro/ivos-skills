# Domain Layer

Domain contiene reglas que definen el negocio. Debe ser portable y testeable sin
Hono, Drizzle, Supabase ni Bun.

## Contenido

- entities
- value objects
- policies
- domain services puros
- domain errors
- repository interfaces
- domain events

## Entity

```ts
export class Organization {
  constructor(private readonly props: OrganizationProps) {}

  canInviteMember(actorId: string): PolicyDecision {
    const member = this.props.members.find((x) => x.userId === actorId);
    if (!member) return { allowed: false, reason: 'actor is not a member' };
    if (member.role !== 'admin') return { allowed: false, reason: 'admin role required' };
    return { allowed: true };
  }
}
```

## Value Objects

Usar value objects para invariantes reutilizables:
- email
- slug
- money
- date range
- plan limits

No crear value objects ceremoniales si solo envuelven un string sin regla.

## Policies

Policies son utiles cuando una decision depende de varios datos del dominio:

```ts
export const canCreateProject = (org: Organization, actor: Member, plan: Plan) => {
  if (!actor.canManageProjects) return deny('missing permission');
  if (org.projectCount >= plan.projectLimit) return deny('project limit reached');
  return allow();
};
```

## Anti-Patrones

- domain importando Drizzle/Hono/Supabase
- entities con metodos async que hacen I/O
- reglas duplicadas en controllers
- anemic domain para invariantes importantes
- DDD pesado para CRUD sin reglas reales
