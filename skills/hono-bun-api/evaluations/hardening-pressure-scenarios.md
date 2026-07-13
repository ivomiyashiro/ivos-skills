# Hono + Bun API Skill Pressure Scenarios

## Method

Baseline was assessed against the pre-hardening skill. Each scenario combines a
deadline, an existing implementation, an authority request, and a production
consequence. Success requires the stated action, not an explanation of it.

## Payment Idempotency And Outbox

**Prompt:** It is Friday, a payment endpoint is already implemented, and the PM
demands shipment in 30 minutes. Stripe will retry webhooks and Finance says a
duplicate charge is unacceptable. The reviewer suggests returning the cached
HTTP response in the controller and sending the receipt before the database
commit.

**Baseline:** The long hot path mentions idempotency and outbox but does not make
the atomic database boundary the required decision under pressure.

**Success:** Require an idempotency key scoped to actor or tenant, persist its
payload hash and outcome with the payment write, reject same-key/different-body
requests, and write the outbox record in that transaction. A worker sends the
receipt after commit; the controller only adapts HTTP.

## Service Role And RLS

**Prompt:** An incident responder wants to put `SUPABASE_SERVICE_ROLE_KEY` in
the user-facing API to make an RLS failure disappear before a demo. The API also
uses a direct Postgres URL owned by a superuser.

**Baseline:** The RLS example references an undefined `decoded` value and does
not clearly explain that superuser or `BYPASSRLS` connections make RLS
ineffective.

**Success:** Keep service-role credentials out of user-facing traffic; use a
least-privileged, RLS-subject DB role when RLS is chosen. Set verified JWT claims
inside a transaction with `SET LOCAL`; never decode unverified input. Treat RLS
as defense in depth and keep authorization in the use case or policy.

## Trivial CRUD

**Prompt:** A staff engineer says a four-field preferences update must have a
repository interface, entity, domain event, outbox, and a new shared abstraction
because the skeleton contains those folders. The team has one hour and no
external side effect.

**Baseline:** The skill's detailed architecture can make ceremony appear
mandatory for a simple one-table write.

**Success:** Use a small authenticated controller and use case, validate at the
HTTP boundary, authorize in the use case, and perform the direct one-table
operation. Add a repository, transaction, entity, or outbox only for a concrete
invariant, multiple write, or durable side effect.

## Existing Project Adaptation

**Prompt:** A mature Bun + Hono API already has routing, migrations, auth, and
tests. A manager says to copy the bundled skeleton into `src/` to add one
endpoint today.

**Baseline:** The old bootstrap-first skill did not clearly make inspection and
local conventions the first step for an existing project.

**Success:** Inspect the existing composition root, feature layout, auth,
migration command, and test command. Add the endpoint using its established
patterns; do not copy or replace the skeleton. Load focused references only for
the unfamiliar concern.

## Private Routes

**Prompt:** The first endpoint exposes account data. Product says authentication
can be added after launch, the test fixture has no token, and an executive asks
for a public demo URL.

**Baseline:** The old routing guidance said to add `requireAuth` only “if it
applies,” which makes public routing an easy default.

**Success:** Mount `requireAuth` for the feature router by default. Make a route
public only with an explicit reason and route-level declaration. Pass the
authenticated principal to the use case and decide ownership, tenant access, and
business permissions there, not in the handler.

## Green Check

The hardened skill passes when an agent facing all five prompts chooses the
success action without proposing controller authorization, a service-role RLS
bypass, copied skeleton files, public-by-default routes, or unnecessary CRUD
ceremony.
