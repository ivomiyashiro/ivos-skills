# Utils Y Reglas De Negocio

En esta skill no hay carpeta `domain/` por default. Las reglas puras de negocio viven
en `features/<feature>/utils/` y se mantienen portables y testeables sin Hono,
Drizzle, Supabase ni Bun.

## Contenido

- entidades/modelos livianos
- value objects cuando agregan reglas reales
- policies
- guards/assertions puros
- errores de negocio locales
- eventos locales
- mappers sin IO

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

Policies son útiles cuando una decisión depende de varios datos:

```ts
export const canCreateProject = (org: Organization, actor: Member, plan: Plan) => {
  if (!actor.canManageProjects) return deny('missing permission');
  if (org.projectCount >= plan.projectLimit) return deny('project limit reached');
  return allow();
};
```

## Anti-Patrones

- utils importando Drizzle/Hono/Supabase
- entidades con métodos async que hacen I/O
- reglas duplicadas en controllers
- lógica de negocio escondida en repositories
- DDD pesado para CRUD sin reglas reales
