---
name: subagent-driven-development
description: Use when executing implementation plans with independent tasks in the current session
---

# Subagent-Driven Development

Execute a written plan with fresh, isolated subagents per task. Use when tasks are independent and this session has subagent support.

Announce: "I'm using subagent-driven-development to execute this plan."

## Decision

| Situation | Use |
|-----------|-----|
| No plan | `brainstorming` -> `writing-plans` |
| Independent tasks + same session + subagents | this skill |
| Tightly coupled, no subagents, or separate session | `executing-plans` |

## Flow

1. Verify an isolated worktree with `using-git-worktrees`.
2. Read `plan.md` only for roadmap, skills, blockers, and parallelism.
3. For each task, read only its `task-NN-*.md`.
4. Dispatch implementer with `implementer-prompt.md`, full task text, cwd, required skills, and any visual mock content.
5. Handle status:
   - `DONE`: review if task is Strict.
   - `DONE_WITH_CONCERNS`: inspect concerns before review.
   - `NEEDS_CONTEXT`: answer and re-dispatch.
   - `BLOCKED`: provide context, upgrade model, split task, or escalate.
6. For Strict tasks, dispatch unified QA with `../requesting-code-review/qa-reviewer.md`.
7. If QA finds issues, same implementer fixes; QA re-reviews.
8. Log progress in `status.md`; keep chat updates concise.
9. After all tasks, use `finishing-a-development-branch`.

## Dispatch Rules

- Fresh subagent per task.
- Pass full task text; do not make subagents read plan files.
- Include `Skills` from task and require loading them.
- Include visual mock content/summary when `Visual reference` exists.
- Do not move to the next task with unresolved QA issues.
- Do not skip review unless task says `Review Level: Self-only` or is clearly mechanical/non-code.
- Do not start on `main`/`master` without explicit user consent.

## Model Choice

| Task | Model |
|------|-------|
| 1-2 files, complete spec, mechanical | cheapest capable |
| multi-file integration/debugging | standard |
| architecture/design/review | strongest available |

## Required Subagent Skills

Implementers load:
- `extreme-brevity`
- `test-driven-development` for code behavior changes
- all task-listed domain skills
- `verification-before-completion` before reporting done

QA reviewers use `../requesting-code-review/qa-reviewer.md`.
