---
name: testing-skills
description: Use when creating or editing discipline-enforcing skills, before deploying them, to verify agents comply under pressure and resist rationalization. Also use when a skill is being ignored or agents find loopholes.
---

# Testing Skills

Testing skills is TDD for process documentation.

## Cycle

| Phase | Action | Success |
|-------|--------|---------|
| RED | run pressure scenario without skill | agent fails; capture exact rationalization |
| GREEN | write minimal skill text | same scenario passes |
| REFACTOR | add counters for new loopholes | still passes under pressure |

## Pressure Scenario Rules

- Combine 3+ pressures: time, sunk cost, fatigue, authority, consequences.
- Force action with concrete options (A/B/C), not academic explanation.
- Use real paths/context.
- Make wrong shortcuts tempting.
- Capture failures verbatim.

## Refactor A Skill When Agent Violates It

Add:
- explicit negation in the rule
- rationalization table entry
- red flag phrase
- description trigger if the violation happens before loading

Re-run the scenario. Repeat until the agent complies while acknowledging the temptation.

## Meta-Test

If the agent still violates the skill, ask:

```markdown
You read the skill and still chose the wrong option.
How should the skill be written so the correct action is unavoidable?
```

Apply useful wording, then re-test.

## Common Mistakes

- writing the skill before baseline failure
- weak/no-pressure scenarios
- accepting explanation instead of action
- generic fixes instead of explicit loophole counters
- stopping after one green run

Reference: `../writing-skills/testing-skills-with-subagents.md`.
