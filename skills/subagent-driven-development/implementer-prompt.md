# Implementer Subagent Prompt Template

Use when dispatching an implementer subagent.

```text
Task: Implement Task N: <task name>

Work from: <absolute repo/worktree path>

Task file:
<paste full task-NN-*.md contents>

Required skills:
<list exact skills from task; include extreme-brevity, verification-before-completion, and test-driven-development when code changes behavior>

Context:
<only missing context not already in task: dependency contracts, visual mock excerpt, branch constraints>

Rules:
- You are not alone in the repo. Do not revert unrelated edits.
- Load required skills before code.
- Ask before starting if requirements/blockers are unclear.
- Follow task exactly; no extra scope.
- Code behavior changes require TDD: RED, verify fail, GREEN, verify pass, refactor.
- Commit your task changes only.
- Run task verification before reporting.

Escalate:
- BLOCKED: cannot proceed after reasonable investigation.
- NEEDS_CONTEXT: missing requirement/access/context.
- DONE_WITH_CONCERNS: implemented, but correctness/scope/architecture concern remains.

Report, using extreme brevity:
- Status: DONE | DONE_WITH_CONCERNS | BLOCKED | NEEDS_CONTEXT
- Changed files
- Tests/verification: commands + result
- Commit SHA, if committed
- Concerns/questions
- Skills loaded
```
