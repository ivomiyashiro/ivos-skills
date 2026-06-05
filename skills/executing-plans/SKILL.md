---
name: executing-plans
description: Use when you have a written implementation plan to execute in a separate session with review checkpoints
---

# Executing Plans

Use for sequential execution, separate sessions, tightly coupled tasks, or platforms without subagents. If tasks are independent and same-session subagents are available, use `subagent-driven-development`.

Announce: "I'm using the executing-plans skill to implement this plan."

## Flow

1. Verify isolated worktree with `using-git-worktrees`; do not implement on main/master without explicit consent.
2. Read `plan.md`; raise blocking plan concerns before starting.
3. Load skills named in the plan/task files. Run `find-skills` only when the plan lacks domain coverage or stack-specific skills.
4. Create task checklist from Macro Plan.
5. Execute tasks in order, reading only the current task file.
6. Enforce TDD for code behavior changes even if the task forgot a RED step.
7. Use visual mocks as specs when referenced.
8. Run each task's verification before marking it complete.
9. After all tasks, invoke `finishing-a-development-branch`.

## Stop Conditions

Stop and ask when:
- blocker or missing dependency
- unclear instruction that affects behavior/scope
- critical plan gap
- repeated verification failure
- required external access or human decision

Do not guess through blockers.

## Required Workflow Skills

- `using-git-worktrees`
- `writing-plans`
- `find-skills` when domain skills may be missing
- `test-driven-development` for code behavior
- `verification-before-completion`
- `finishing-a-development-branch`
