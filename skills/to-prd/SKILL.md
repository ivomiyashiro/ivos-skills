---
name: to-prd
description: Synthesize the current conversation context into a PRD (Product Requirements Document). Use after brainstorming when the design is already agreed and you need to formalize it as a PRD on the issue tracker. Do NOT use as a replacement for brainstorming — run brainstorming first to reach design alignment, then to-prd to publish it.
---

# To PRD

Synthesize the current conversation context and codebase understanding into a PRD. Do NOT interview the user — synthesize what is already known.

## Process

### 1. Explore the repo

If you haven't already explored the codebase, do it now. Read `CONTEXT.md` (domain glossary) if it exists — use its vocabulary throughout the PRD.

### 2. Identify modules

Identify which modules need to be built or modified. Actively look for opportunities to design **deep modules** — small interfaces with substantial implementation that can be tested in isolation. Present the module list to the user and confirm it matches their expectations. Ask which modules they want covered by tests.

### 3. Write the PRD

Use the template below. Save it to `docs/prd/YYYY-MM-DD-<feature-name>.md` unless the user specifies a different location.

---

## PRD Template

```markdown
## Problem Statement

The problem the user is facing, from the user's perspective.

## Solution

The solution to the problem, from the user's perspective.

## User Stories

Numbered, exhaustive list of user stories covering all aspects of the feature. Each in the format:

1. As a <actor>, I want <feature>, so that <benefit>

## Implementation Decisions

List of implementation decisions made. May include:
- Modules to be built or modified
- Interfaces of those modules
- Technical clarifications
- Architectural decisions
- Schema changes
- API contracts
- Specific interactions

Do NOT include specific file paths or code snippets (they go stale quickly).
Exception: if a prototype produced a snippet that encodes a decision better than prose (state machine, schema, type shape), include it with a note that it came from a prototype.

## Testing Decisions

List of testing decisions:
- Description of what makes a good test (only test external behavior, not implementation details)
- Which modules will be tested
- Prior art in the codebase (existing similar tests)

## Out of Scope

What is explicitly out of scope for this PRD.

## Further Notes

Any additional notes about the feature.
```
