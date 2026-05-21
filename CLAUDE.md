# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this repo is

`ivos-skills` is a personal collection of skills for AI agents (Claude Code, OpenCode, Copilot CLI, Gemini CLI, etc.). Each skill is a Markdown-based reference guide that agents load at runtime to apply proven techniques and patterns.

## Repository structure

```
skills/
  <skill-name>/
    SKILL.md              # Main skill document (required)
    supporting-files.*    # Scripts, templates, examples (optional)
.claude-plugin/
  plugin.json             # Claude Code plugin metadata
  marketplace.json        # Marketplace listing
.opencode/
  plugins/ivos-skills.js  # OpenCode plugin entry point
  INSTALL.md              # OpenCode-specific install guide
package.json              # npm package (used by OpenCode plugin manager)
INSTALL.md                # Installation guide for all agents
```

## Skill anatomy

Every skill follows this structure:

```markdown
---
name: skill-name-with-hyphens
description: Use when [specific triggering conditions and symptoms]
---

# Skill Name
## Overview
## When to Use
## Core Pattern / Quick Reference / Implementation
## Common Mistakes
```

**Frontmatter rules:**
- `name`: letters, numbers, hyphens only — no special characters
- `description`: starts with "Use when…", third person, triggering conditions only — never summarize the skill's workflow (Claude may follow the description instead of reading the full skill)
- Total frontmatter ≤ 1024 characters

## Adding or editing a skill

1. Create `skills/<name>/SKILL.md` following the structure above.
2. Follow TDD: run a baseline scenario with a subagent *without* the skill first, document what fails, then write the skill to address those failures.
3. Test with a subagent *with* the skill before committing.
4. Commit and push — Claude Code and OpenCode pick up changes on next update.

No build step is required. Skills are plain Markdown files discovered by path.

## Rendering flowcharts

Skills may contain `dot` code blocks. Render them to SVG with:

```bash
node skills/writing-skills/render-graphs.js skills/<skill-name>
node skills/writing-skills/render-graphs.js skills/<skill-name> --combine
```

Requires Graphviz (`dot` on PATH).

## Plugin systems

| Agent | Integration | Update command |
|-------|-------------|----------------|
| Claude Code | `.claude-plugin/` | `claude plugins update ivos-skills` |
| OpenCode | `.opencode/plugins/ivos-skills.js` injects `skills/` path into config | Change pinned tag in `opencode.json`, restart |
| Skills CLI | `package.json` + `skills/` directory | `npx skills update ivos-skills -g` |

## Key conventions

- **CSO (Claude Search Optimization):** Description field must only describe *when* to trigger the skill, never the workflow. Descriptions that summarize workflow become shortcuts Claude takes instead of reading the full skill.
- **Token budget:** Getting-started and frequently-loaded skills target < 150–200 words. Other skills < 500 words.
- **One great example beats many mediocre ones.** Prefer inline code for patterns < 50 lines; link to a separate file for heavy reference (100+ lines).
- **Flowcharts only for non-obvious decisions** — never for linear steps, reference material, or code examples.
- **No skill without a failing baseline test first** (same Iron Law as TDD).
