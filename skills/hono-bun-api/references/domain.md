# Reglas De Negocio Locales

En esta skill no hay carpeta `domain/` ni `utils/` por default. Las reglas puras de
negocio empiezan como helpers privados dentro del command o query que las posee y se
mantienen portables y testeables sin Hono, Drizzle, Supabase ni Bun.

## Contenido

- entidades/modelos livianos
- value objects cuando agregan reglas reales
- policies
- guards/assertions puros
- errores de negocio locales
- eventos locales
- mapping sin IO cuando pertenece a la operación

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

- helpers locales importando Drizzle/Hono/Supabase
- entidades con métodos async que hacen I/O
- reglas duplicadas en routes
- lógica de negocio escondida en repositories extraídos
- DDD pesado para CRUD sin reglas reales
