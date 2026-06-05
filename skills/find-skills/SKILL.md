---
name: find-skills
description: Helps users discover and install agent skills when they ask questions like "how do I do X", "find a skill for X", "is there a skill that can...", or express interest in extending capabilities. This skill should be used when the user is looking for functionality that might exist as an installable skill.
---

# Find Skills

Use the Skills CLI to discover reusable skills before inventing workflow.

## Commands

```bash
npx skills find "<query>"
npx skills add <owner/repo@skill> -g -y
npx skills check
npx skills update
```

Browse: https://skills.sh/

## Search Protocol

1. Identify domain + task: e.g. `react performance`, `flutter widget test`, `hono api`, `supabase auth`.
2. Search with 1-3 specific queries.
3. Prefer reputable sources and 1K+ installs. Be cautious under 100 installs.
4. Recommend only skills whose trigger matches the task.
5. If installing, use `npx skills add <owner/repo@skill> -g -y`.

## Output

When useful, report:
- skill name
- source/install count
- install command
- why it fits

If nothing good exists, say so and proceed with local expertise.
