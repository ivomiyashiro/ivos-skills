---
name: writing-plans
description: Use when you have a spec or requirements for a multi-step task, before touching code
---

# Writing Plans

## Overview

Create implementation plans that are **macro in scope, atomic in execution, lean in tokens**.

The executor may receive only one task file in isolation. Each task must contain enough context to execute safely, but no repeated lectures, filler, or global rules already stated in `plan.md`.

**Announce at start:** "I'm using the writing-plans skill to create the implementation plan."

**Domain awareness:** Read `CONTEXT.md` if it exists. Use its vocabulary in task names, descriptions, and acceptance criteria.

**Save plans to:**
- Macro plan: `docs/plans/YYYY-MM-DD-<feature-name>/plan.md`
- Task files: `docs/plans/YYYY-MM-DD-<feature-name>/task-NN-<short-name>.md`
- User-specified locations override these defaults.

## Lean Planning Contract

Optimize for the smallest plan that remains executable.

Keep:
- Exact file paths, task order, blockers, and verification commands.
- FR/AC coverage from the spec.
- Test behavior, inputs, outputs, and edge cases for code tasks.
- Interfaces or contracts a later task depends on.
- Human decisions, external access, and manual QA gates.

Cut:
- Repeated explanations of TDD, AFK/HITL, skill usage, or project background.
- Generic advice like "handle errors", "add validation", or "write tests".
- Narrative rationale once the decision is clear.
- Boilerplate sections with no useful content.

**Compact does not mean vague.** If removing text makes a task ambiguous, non-reviewable, or dependent on hidden context, keep the text.

## 1. Macro Plan

Write `plan.md` first. It is the roadmap and global context.

```markdown
# <Feature> Implementation Plan

## Source Spec
`docs/specs/YYYY-MM-DD-<topic>-design.md`

## Macro Plan
| # | Task | Goal | File | Blocked by | Parallel with | Type |
|---|------|------|------|------------|---------------|------|
| T1 | <short name> | <one-line outcome> | `task-01-<name>.md` | None | None | AFK |

## Required Skills
- `test-driven-development` - all code behavior changes
- `<domain-skill>` - <1-2 applicable rules>

## File Map
| Path | Action | Responsibility |
|------|--------|----------------|
| `path/to/file` | Create/Modify | <one clear responsibility> |
```

Macro rules:
- Aim for **5-8 high-value tasks**. More than 15 usually means split the feature.
- Each task should be cohesive: roughly 15-30 minutes for a skilled developer.
- Split frontend and backend work into separate tasks unless the change is pure wiring.
- Mark each task **AFK** or **HITL**. Default AFK; use HITL only for human decisions, review, secrets, external access, or manual QA.
- Mark parallel tasks only when they have no blockers, shared files, or hidden state conflicts.

## 2. Required Skills

Before task details, discover relevant skills:

1. Load `find-skills`.
2. Search by domain/stack/task: e.g. `react`, `flutter`, `hono`, `supabase`, `routing`, `json`.
3. Keep only relevant, trustworthy skills.
4. Put global skills in `plan.md`; put task-specific rules only where they change execution.

Task annotations should be short:

```markdown
**Skills:** `test-driven-development`; `react-best-practices` (stable props, no derived state effects)
```

Do not paste long excerpts from skills into every task. Extract only the 1-2 rules that matter.

## 3. TDD by Default

Every task that writes or changes application/business behavior must follow TDD: RED -> GREEN -> REFACTOR.

Task classification:

| Task type | TDD |
|-----------|-----|
| Business logic, bug fix, behavior change | Required |
| Tests | Required |
| Wiring/plumbing | Optional, but verify |
| Config/docs/mechanical refactor | Optional, but verify |

Forbidden:
- Production behavior before a failing test.
- "Write tests later."
- A task that says "implement X" without a RED step or verification.
- Literal production code in GREEN. Describe the approach and constraints instead.

Allowed:
- Test scenarios instead of literal test code.
- Interfaces, signatures, API contracts, example payloads, and commands when needed for clarity.
- Pseudocode only when it prevents ambiguity without prescribing implementation.

## 4. Lean Task Template

Each task file must be self-contained. Use this compact shape:

```markdown
# Task NN: <Name>

**Goal:** <one sentence outcome>
**Type:** AFK | HITL
**Task type:** Business logic | Tests | Wiring | Config | Docs | Refactor
**Files:** Create/modify/test exact paths
**Blocked by:** T# | None
**Skills:** `test-driven-development`; `<skill>` (<rule fragments>) | None
**Visual reference:** `docs/mocks/<file>.html` | None
**Context:** <1-3 sentences: why this exists, current relevant state, contracts from prior tasks>

## Acceptance Criteria
- [ ] <measurable outcome>
- [ ] <verification-visible outcome>

## Steps
- [ ] RED: <test behavior, inputs/outputs, edge cases, command to run, expected failure reason>
- [ ] GREEN: <implementation strategy/constraints, no literal production code>
- [ ] REFACTOR: <specific cleanup only, or "None">
- [ ] VERIFY: <commands; expected pass condition>
- [ ] COMMIT: <message>

## Definition of Done
- [ ] ACs met
- [ ] Required tests pass
- [ ] No relevant regressions
- [ ] Commit created
```

Use fewer fields only for non-code tasks when the omission cannot hide risk. Never omit `Goal`, `Type`, `Files`, `Blocked by`, `Acceptance Criteria`, `VERIFY`, or `Definition of Done`.

## 5. Atomicity And Isolation

Every task must be:
- **Cohesive:** one focused slice, not scattered cleanup.
- **Self-contained:** includes all paths, contracts, commands, and prior-task interfaces needed to execute.
- **Deterministic:** exact expected behavior and pass/fail checks.
- **Reviewable:** controller can verify with one command or one focused inspection.

When a task depends on prior work, repeat the needed contract:
- Function/class name and signature.
- Route, payload, or schema shape.
- File path and expected current state.

Never write:
- "Same as T3", "similar to above", "TBD", "TODO", "fill in details".
- "Add appropriate error handling" without naming the error cases and expected outcomes.
- "Write tests for the above" without behavior, inputs, outputs, and edge cases.
- References to functions/types/files not defined in the task or prior-task contract.

## 6. Self-Review

After writing the plan, fix issues inline:

1. **Spec coverage:** every FR/AC maps to at least one task; no scope creep.
2. **Macro sanity:** order, blockers, AFK/HITL, and parallelism are correct.
3. **Task contract:** each task has required lean fields and enough context to run alone.
4. **TDD scan:** code behavior tasks start with RED and avoid production code in GREEN.
5. **Placeholder scan:** no TBD/TODO/generic edge-case language.
6. **Consistency:** names, signatures, paths, task IDs, and dependencies match across files.
7. **Token check:** remove repeated rule explanations and narrative that do not affect execution.

If a shorter version would still be executable, shorten it. If it would lose a contract, keep the detail.

## Scope Change Protocol

During execution:
- Trivial typo/rename: fix inline, mention in commit.
- Non-trivial approach, file, or behavior change: stop and report to controller.
- Controller decides: minor update -> amend affected task files; major divergence -> create `spec-v2.md` or `plan-v2.md`.
- User-requested new scope gets a new spec/plan unless it fits the approved spec.

Never silently overwrite the original spec or plan.

## Execution Handoff

After saving the plan, offer:

```markdown
Plan saved to `docs/plans/<feature-name>/`.

1. Subagent-driven: dispatch one isolated task per subagent; parallelize where safe.
2. Inline: execute tasks sequentially in this session with checkpoints.

Which approach?
```

If subagent-driven: use `subagent-driven-development`. The controller must pass the full task file to the implementer, including `Skills`.

If inline: use `executing-plans`. Read `plan.md`, then each task in order.
