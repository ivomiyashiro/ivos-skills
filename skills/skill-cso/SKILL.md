---
name: skill-cso
description: Use when writing or editing skill descriptions, names, or keywords to ensure agents discover and load the right skills at the right time. Also use when a skill is being ignored, loaded incorrectly, or its description is ambiguous.
---

# Skill: Claude Search Optimization (CSO)

## Overview

Future agents need to FIND your skill before they can FOLLOW it. CSO optimizes skill metadata so agents make correct load/no-load decisions.

**Core principle:** Description = when to use, NOT what the skill does. Rich keywords. Token-efficient.

---

## 1. The Description Field

**Purpose:** The description is the gate. Agents read it to decide "Should I load this skill now?"

**CRITICAL: Description = When to Use, NOT What It Does**

When a description summarizes the skill's workflow, agents may follow the summary instead of reading the full skill. A description saying "code review between tasks" caused agents to do ONE review, even though the skill required TWO. Changing the description to just triggering conditions fixed this.

**The trap:** Descriptions that summarize workflow create a shortcut agents will take. The skill body becomes documentation they skip.

**Format:** Start with "Use when..." to focus on triggering conditions.

```yaml
# BAD: Summarizes workflow - agent may follow this instead of reading skill
description: Use when executing plans - dispatches subagent per task with code review between tasks

# BAD: Too much process detail
description: Use for TDD - write test first, watch it fail, write minimal code, refactor

# GOOD: Just triggering conditions, no workflow summary
description: Use when executing implementation plans with independent tasks in the current session

# GOOD: Triggering conditions only
description: Use when implementing any feature or bugfix, before writing implementation code
```

**Content:**
- Use concrete triggers, symptoms, and situations that signal this skill applies
- Describe the *problem* (race conditions, inconsistent behavior) not *language-specific symptoms* (setTimeout, sleep)
- Keep triggers technology-agnostic unless the skill itself is technology-specific
- If skill is technology-specific, make that explicit in the trigger
- Write in third person (injected into system prompt)
- **NEVER summarize the skill's process or workflow**

```yaml
# BAD: Too abstract, vague, doesn't include when to use
description: For async testing

# BAD: First person
description: I can help you with async tests when they're flaky

# BAD: Mentions technology but skill isn't specific to it
description: Use when tests use setTimeout/sleep and are flaky

# GOOD: Starts with "Use when", describes problem, no workflow
description: Use when tests have race conditions, timing dependencies, or pass/fail inconsistently

# GOOD: Technology-specific skill with explicit trigger
description: Use when using React Router and handling authentication redirects
```

**Length:** Max 1024 characters total for frontmatter. Keep under 500 characters if possible.

---

## 2. Keyword Coverage

Use words agents would search for:
- **Error messages:** "Hook timed out", "ENOTEMPTY", "race condition"
- **Symptoms:** "flaky", "hanging", "zombie", "pollution"
- **Synonyms:** "timeout/hang/freeze", "cleanup/teardown/afterEach"
- **Tools:** Actual commands, library names, file types

Sprinkle these throughout the skill body, not just the description.

---

## 3. Naming Conventions

**Use active voice, verb-first:**
- `creating-skills` not `skill-creation`
- `condition-based-waiting` not `async-test-helpers`

**Name by what you DO or core insight:**
- `root-cause-tracing` > `debugging-techniques`
- `flatten-with-flags` > `data-structure-refactoring`

**Gerunds (-ing) work well for processes:**
- `creating-skills`, `testing-skills`, `debugging-with-logs`

**Rules:**
- Letters, numbers, and hyphens only (no parentheses, special chars)
- Max 1024 chars total for frontmatter

---

## 4. Token Efficiency

**Problem:** Getting-started and frequently-referenced skills load into EVERY conversation. Every token counts.

**Targets:**
- Getting-started workflows: <150 words each
- Frequently-loaded skills: <200 words total
- Other skills: <500 words (still be concise)

**Techniques:**

**Move details to tool help:**
```markdown
# BAD: Document all flags in SKILL.md
search-conversations supports --text, --both, --after DATE, --before DATE, --limit N

# GOOD: Reference --help
search-conversations supports multiple modes and filters. Run --help for details.
```

**Use cross-references:**
```markdown
# BAD: Repeat workflow details
When searching, dispatch subagent with template...
[20 lines of repeated instructions]

# GOOD: Reference other skill
Always use subagents (50-100x context savings). REQUIRED: Use [other-skill-name] for workflow.
```

**Compress examples:**
```markdown
# BAD: Verbose example (42 words)
Partner: "How did we handle authentication errors in React Router before?"
You: I'll search past conversations for React Router authentication patterns.
[Dispatch subagent with search query: "React Router authentication error handling 401"]

# GOOD: Minimal example (20 words)
Partner: "How did we handle auth errors in React Router?"
You: Searching...
[Dispatch subagent -> synthesis]
```

**Eliminate redundancy:**
- Don't repeat what's in cross-referenced skills
- Don't explain what's obvious from command names
- Don't include multiple examples of the same pattern

**Verification:**
```bash
wc -w skills/path/SKILL.md
# getting-started workflows: aim for <150 each
# Other frequently-loaded: aim for <200 total
```

---

## 5. Cross-Referencing Other Skills

When writing documentation that references other skills:

Use skill name only, with explicit requirement markers:
- `**REQUIRED SUB-SKILL:** Use test-driven-development`
- `**REQUIRED BACKGROUND:** You MUST understand systematic-debugging`

**Why no @ links:** `@` syntax force-loads files immediately, consuming 200k+ context before you need them.

---

## 6. Discovery Workflow

How future agents find your skill:

1. **Encounters problem** ("tests are flaky")
2. **Finds SKILL** (description matches)
3. **Scans overview** (is this relevant?)
4. **Reads patterns** (quick reference table)
5. **Loads example** (only when implementing)

**Optimize for this flow:** Put searchable terms early and often.

---

## Quick Reference

| Element | Rule |
|---------|------|
| Description | "Use when..." + triggers only. Never summarize workflow. |
| Keywords | Error messages, symptoms, tools, synonyms throughout body |
| Name | Verb-first, active voice, gerunds for processes |
| Length | Getting-started <150 words; frequent <200 words; others <500 |
| Cross-references | `skill-name`, never `@` links |
| Redundancy | Reference, don't repeat. Use `--help` for flags. |
