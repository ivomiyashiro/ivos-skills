---
name: hono-bun-api
description: Use when building or modifying TypeScript APIs that run on Bun and use Hono for routes, middleware, OpenAPI, controllers, or HTTP integration tests.
---

# Hono + Bun API

Build a modular Hono API with Bun at runtime boundaries. Keep HTTP thin; use cases
own business decisions and persistence orchestration.

## Choose The Starting Path

**Greenfield:** inspect `assets/project-skeleton/`, then copy it only into a new
project. Run `bun install --frozen-lockfile`, copy `.env.example`, configure the
database, run `bun run db:migrate`, then `bun run check` and `bun run dev`.
For schema changes: edit `src/shared/db/schema.ts`, run `bun run db:generate`,
review the generated migration, then run `bun run db:migrate` locally and in the
deployment flow.

**Existing project:** inspect its app/composition root, route convention, auth,
migrations, and test commands first. Extend those conventions; never copy the
skeleton over an established application. Load only the reference needed for an
unfamiliar concern.

## Hot Path

1. Put a capability in `features/<feature>/`: routes define Hono/OpenAPI,
controllers adapt HTTP, commands/queries execute use cases, and repositories or
read models perform persistence. Use Zod at the boundary. Use cases never import
Hono.
2. Make feature routes private by default with `r.use('*', requireAuth)`. A public
route needs an explicit reason and route-level declaration. Middleware verifies
identity; controllers pass the principal to the use case; use cases or pure
policies decide ownership, tenant access, and business permissions. Do not put
authorization decisions in handlers.
3. Use least-privileged database credentials. RLS is optional defense in depth,
not backend authorization. It works only when the DB role is subject to RLS; a
Postgres superuser or `BYPASSRLS` role bypasses it. Never use a Supabase
service-role credential for user-facing traffic.
4. Keep trivial one-table CRUD small. Add entities, repositories, transactions,
or events only for a real invariant or boundary. For multiple writes or durable
external side effects, use one transaction and an outbox. Retryable payments,
webhooks, invitations, and sensitive creates require an idempotency key scoped
to the actor or tenant plus a payload hash.
5. Queries return projected DTOs, filter tenant scope in SQL, enforce limits and
stable pagination, and avoid N+1. External calls have timeouts; retry only safe,
idempotent operations. Test policies/use cases plus `app.request()` HTTP flows.

## Reference Routing

| Need | Reference |
|---|---|
| Architecture and boundaries | `references/architecture.md`, `references/features.md`, `references/domain.md`, `references/shared.md` |
| HTTP and contracts | `references/routing.md`, `references/validation.md`, `references/openapi.md`, `references/errors.md`, `references/rpc-client.md` |
| Commands and reads | `references/commands.md`, `references/queries.md`, `references/read-context.md`, `references/repositories.md` |
| Database and DI | `references/database.md`, `references/transactions.md`, `references/di.md` |
| Identity and tenancy | `references/auth.md`, `references/supabase-infrastructure.md`, `references/multi-tenancy.md` |
| Reliability | `references/idempotency.md`, `references/outbox.md`, `references/events.md`, `references/timeouts-and-retries.md`, `references/rate-limits-and-backpressure.md`, `references/caching.md` |
| Performance and operation | `references/performance.md`, `references/pagination-and-indexes.md`, `references/config.md`, `references/observability.md`, `references/lifecycle.md` |
| Delivery | `references/feature-walkthrough.md`, `references/testing.md` |

## Before Shipping

- [ ] Zod validates HTTP input; controllers contain no SQL or authorization rules.
- [ ] Every feature is private unless an explicit public-route decision exists.
- [ ] Use cases authorize the authenticated actor and scope data by tenant/owner.
- [ ] Migrations are generated, reviewed, and applied through `db:migrate`.
- [ ] Critical writes have transactions, idempotency where retryable, and outbox-backed side effects.
- [ ] `bun run check` and relevant HTTP tests pass.
