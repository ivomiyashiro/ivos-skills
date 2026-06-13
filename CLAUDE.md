# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this repo is

`ivos-skills` is a personal collection of tool, framework, and library skills for AI agents (Claude Code, OpenCode, Copilot CLI, Gemini CLI, etc.). Each skill is a Markdown-based reference guide that agents load at runtime for specific technologies such as Flutter, React, Hono/Bun, Supabase, and Postgres.

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
plugin.json               # Antigravity CLI plugin metadata
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
2. Keep the scope focused on concrete tools, frameworks, and libraries. Do not add general productivity or software-development-process skills.
3. Test the skill before committing.
4. **CRITICAL: VERSION BUMPING**. If you modify or add skills, YOU MUST ensure the version is bumped across ALL manifest files. The repo has a `scripts/bump-version.js` script that handles this. Just making a `git commit` will automatically trigger the `pre-commit` hook to run this script and sync the following files:
   - `plugin.json` (Antigravity/Gemini)
   - `package.json` (OpenCode/npm)
   - `.claude-plugin/plugin.json` (Claude Code)
   - `.claude-plugin/marketplace.json` (Claude Marketplace)
   - `.codex-plugin/plugin.json` (Codex)
5. Commit and push — The `post-commit` hook will automatically create a git tag, and `git push` will push the tags so agents can pull the updates.

No build step is required. Skills are plain Markdown files discovered by path.

## Plugin systems

| Agent | Integration | Update command |
|-------|-------------|----------------|
| Claude Code | `.claude-plugin/` | `claude plugins update ivos-skills` |
| Codex | `.codex-plugin/plugin.json` + `plugins/ivos-skills/plugin.json` (marketplace) | `codex plugin marketplace upgrade ivos-skills` |
| OpenCode | `.opencode/plugins/ivos-skills.js` injects `skills/` path into config | Change pinned tag in `opencode.json`, restart |
| Skills CLI | `package.json` + `skills/` directory | `npx skills update ivos-skills -g` |
| Antigravity CLI | `plugin.json` | `agy plugin uninstall ivos-skills` followed by `agy plugin install https://github.com/ivomiyashiro/ivos-skills.git` |

## Key conventions

- **CSO (Claude Search Optimization):** Description field must only describe *when* to trigger the skill, never the workflow. Descriptions that summarize workflow become shortcuts Claude takes instead of reading the full skill.
- **Scope:** Keep this package limited to concrete tools, frameworks, and libraries.
- **Token budget:** Getting-started and frequently-loaded skills target < 150–200 words. Other skills < 500 words.
- **One great example beats many mediocre ones.** Prefer inline code for patterns < 50 lines; link to a separate file for heavy reference (100+ lines).
- **Flowcharts only for non-obvious decisions** — never for linear steps, reference material, or code examples.
