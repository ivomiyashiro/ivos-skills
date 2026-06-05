---
name: skill-cso
description: Use when writing or editing skill descriptions, names, or keywords to ensure agents discover and load the right skills at the right time. Also use when a skill is being ignored, loaded incorrectly, or its description is ambiguous.
---

# Skill CSO

Optimize skill metadata so future agents load the right skill at the right time.

## Description Rule

Description = **when to use**, not what the skill does.

Bad descriptions summarize workflow; agents may follow the summary and skip the body. Good descriptions list triggering conditions, symptoms, tech stack, or situations.

```yaml
# Bad
description: Use for TDD - write tests first, implement, refactor

# Good
description: Use when implementing any feature or bugfix, before writing implementation code
```

## Checklist

- Starts with `Use when...`
- Third person, no "I".
- Trigger conditions only; no workflow summary.
- Concrete symptoms and synonyms included.
- Tech-specific only when the skill is tech-specific.
- Name is verb-first/active, letters/numbers/hyphens only.
- Frontmatter under 1024 chars; description ideally under 500.
- Hot-path `SKILL.md` is lean; details moved to references.
- Cross-references use skill names, not `@` force-load paths.

## Keywords

Include terms agents would search:
- errors: `Hook timed out`, `ENOTEMPTY`
- symptoms: flaky, hanging, race condition, zombie, pollution
- synonyms: timeout/hang/freeze, cleanup/teardown
- tools/files: actual commands, libraries, extensions

## Token Targets

| Skill type | Target |
|------------|--------|
| getting-started/hot path | <150-200 words |
| frequent workflow | <500 words |
| rare/reference-heavy | lean `SKILL.md` + reference files |
