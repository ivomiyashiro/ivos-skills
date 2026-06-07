# Template: feature slice

Consumido por `scripts/scaffold-feature.ts`.

El output usa:
- HTTP adapter: `routes/`, `controller/`
- Use cases: `use-cases/commands/`, `use-cases/queries/`
- Repository: write repository, mapper, read model
- Utils: entity/policies/events/helpers locales

Despues de scaffoldear, registrar tabla Drizzle, repo/read model en `container.ts`
y montar rutas en `app.ts`.
