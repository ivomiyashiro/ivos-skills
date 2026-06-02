# Template: module slice

Consumido por `scripts/scaffold-module.ts`.

El output usa:
- HTTP adapter: `__modules__.routes.ts`, `__modules__.controller.ts`
- Application: `commands/`, `queries/`, `handlers/`
- Domain: entity, policies, events, repository interface
- Infrastructure: Drizzle repository, mapper, read model

Despues de scaffoldear, registrar tabla Drizzle, repo/read model en `container.ts`
y montar rutas en `app.ts`.
