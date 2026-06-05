---
name: brainstorming
description: "You MUST use this before any creative work - creating features, building components, adding functionality, or modifying behavior. Explores user intent, requirements and design before implementation."
---

# Brainstorming Ideas Into Designs

Turn ideas into approved specs before implementation.

<HARD-GATE>
Do not invoke implementation skills, write code, scaffold, or edit behavior until the design is presented and approved. Even simple changes need a short design.
</HARD-GATE>

## Flow

1. Explore project context: files, docs, recent commits, `CONTEXT.md` if present.
2. If visual decisions are likely, offer the Visual Companion in its own message.
3. Ask clarifying questions one at a time.
4. Verify user claims against code before relying on them.
5. Discover relevant domain skills with `find-skills` before proposing architecture/stack.
6. Propose 2-3 approaches with trade-offs and recommendation.
7. Present design sections for approval; revise until approved.
8. If UI/frontend: save approved mocks to `docs/mocks/` and get approval.
9. Write lean spec to `docs/specs/YYYY-MM-DD-<topic>-design.md`; self-review; commit.
10. Ask user to review spec. After approval, invoke `writing-plans`.

## Clarifying Rules

- One question per message; multiple choice preferred.
- If scope spans independent subsystems, decompose and spec the first slice only.
- Challenge vocabulary conflicts with `CONTEXT.md`; update glossary when terms are resolved.
- Refine fuzzy terms into canonical project vocabulary.
- Follow existing architecture and patterns; include only refactors needed for the goal.

## Design Content

Cover only what affects implementation:
- architecture/components
- data flow/contracts
- error handling
- testing/verification
- dependencies/constraints
- out of scope

Prefer a few precise sentences. Expand only where brevity would create ambiguity.

## Lean Spec Contract

```markdown
# <Topic> Design

## Problem / Opportunity
<1 short paragraph>

## Functional Requirements & Acceptance Criteria
| ID | Requirement | Acceptance Criteria |
|----|-------------|---------------------|
| FR1 | <atomic measurable behavior> | Given <state>, when <action>, then <observable result>. |

## Constraints & Non-Functional Requirements
- <real constraint> | None

## Out of Scope
- <explicit exclusion>

## Dependencies
- <service/library/internal system> | None

## Risks & Mitigations
| Risk | Mitigation |
|------|------------|
| <real risk> | <concrete mitigation> |
```

Rules:
- Target 3-8 FRs; split if larger.
- ACs must be testable, even if compact.
- Do not include task breakdown; that belongs in `writing-plans`.
- Write `None` for empty sections.

Self-review: no placeholders, all sections present, FR/ACs measurable, no contradictions, coherent scope, no prose that does not affect implementation/verification/scope.

## User Review Gate

After writing and committing the spec:

```text
Spec written and committed to `<path>`. Please review it and let me know if you want changes before we start the implementation plan.
```

Wait. If changed, update spec and re-run self-review.

## Visual Companion

Offer only when upcoming questions are visual:

```text
Some of what we're working on might be easier to explain if I can show it to you in a web browser. I can put together mockups, diagrams, comparisons, and other visuals as we go. This feature is still new and can be token-intensive. Want to try it? (Requires opening a local URL)
```

This offer must be the only content in that message. If accepted, read `visual-companion.md`.

Use browser visuals for mockups/layout diagrams/comparisons. Use text for conceptual choices, scope, requirements, and trade-offs.

For UI/frontend work, save approved companion outputs to `docs/mocks/` before writing the spec; read `visual-mocks.md` for the exact save workflow.

## After Approval

Invoke `writing-plans`. Do not invoke implementation skills directly from brainstorming.
