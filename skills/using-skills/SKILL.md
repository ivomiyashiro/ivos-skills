---
name: using-skills
description: Use when starting any conversation - establishes how to find and use skills, requiring Skill tool invocation before ANY response including clarifying questions
---

<SUBAGENT-STOP>
If dispatched as a subagent for a specific task, skip this skill.
</SUBAGENT-STOP>

# Using Skills

## Core Rule

If a skill might apply, invoke it before any response, clarification, search, or edit. User instructions still outrank skills.

Use the minimal relevant set:
1. Discovery: `find-skills` when external/domain skills may exist.
2. Process: `brainstorming`, `systematic-debugging`, `writing-plans`, etc.
3. Domain: React, Flutter, Hono, Supabase, frontend, testing, docs, etc.

Announce loaded skills in one short line and follow the skill body exactly.

## Platform Mapping

| Platform | Skill tool |
|----------|------------|
| Claude Code | `Skill` |
| OpenCode | `skill` |
| Copilot CLI | `skill` |
| Gemini CLI | `activate_skill` |

If the platform differs, adapt tool names but preserve the workflow.

## When To Discover More Skills

Before complex implementation, bugs, architecture, UI, APIs, databases, tests, docs, or deployment:
- load `find-skills`
- search by stack/task (`react`, `flutter`, `hono`, `supabase`, `testing`, `frontend`)
- prefer reputable skills with 1K+ installs

## Red Flags

Stop and load skills if thinking:
- "I'll inspect files first."
- "This is simple."
- "I remember the workflow."
- "I just need one quick command."
- "A skill would be overkill."

Instructions say what to do; skills say how to do it.
