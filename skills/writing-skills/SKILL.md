---
name: writing-skills
description: Use when creating new skills, editing existing skills, or verifying skills work before deployment
---

# Writing Skills

Skills are reusable techniques, patterns, tools, or references. They are not one-off solution stories.

## Iron Law

Skill writing is TDD for process documentation.

No new or edited skill without a failing pressure scenario first. If you wrote the skill before testing baseline behavior, delete or revert and restart.

Use `testing-skills` for the test workflow and `skill-cso` for discoverability.

## Workflow

1. **RED:** create realistic pressure scenario; run without the skill; capture failures/rationalizations.
2. **GREEN:** write the smallest skill text that prevents those failures.
3. **VERIFY:** run same scenario with the skill; agent must comply.
4. **REFACTOR:** close new loopholes; re-test.
5. **DEPLOY:** commit/push/version according to repo/plugin instructions.

## Skill Shape

```markdown
---
name: verb-first-name
description: Use when <triggering conditions only>
---

# Skill Name

## Overview
<core principle>

## When To Use
<symptoms/triggers>

## Workflow / Pattern
<minimal actionable steps>

## Red Flags / Common Mistakes
<loopholes to avoid>

## References
<only if extra detail is needed>
```

## Authoring Rules

- Description says **when to load**, not workflow summary.
- Keep hot-path `SKILL.md` lean; move heavy examples/API docs to references.
- Use concrete triggers, symptoms, error messages, tools, and synonyms.
- Cross-reference skills by name, not `@` paths.
- Add explicit counters for rationalizations observed in RED.
- Frequently loaded skills should be as short as possible; target <500 words unless the skill is rarely loaded.

## When To Create

Create/update a skill when the pattern is reusable, non-obvious, broadly useful, and not easily enforced by automation.

Do not create skills for one-off project conventions, standard docs, or mechanical rules better handled by scripts.

## References

- `testing-skills-with-subagents.md`
- `anthropic-best-practices.md`
- `persuasion-principles.md`
- `graphviz-conventions.dot`
