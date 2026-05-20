---
name: domain-glossary
description: Maintain the project's domain glossary (CONTEXT.md) and architectural decisions (docs/adr/). Use when starting work in a new project, when a domain term needs precision, or when a key architectural decision is made. Reference this from other skills before touching code.
---

# Domain Glossary

Maintain two sources of truth for the project's domain and decisions. Read them before starting any skill. Update them inline as things crystallize — never batch.

## Structure

```
/
├── CONTEXT.md          ← domain glossary (terms only, no implementation)
└── docs/
    └── adr/
        ├── 0001-<slug>.md
        └── 0002-<slug>.md
```

Create files **lazily**: only when you have something to write. Don't scaffold empty files upfront.

---

## CONTEXT.md — Glossary

**Rule:** `CONTEXT.md` is a glossary and nothing else. No implementation details, no specs, no decisions, no file paths.

### When to create

Create it when the first domain term is resolved during a grilling or planning session.

### Format

```markdown
# Domain Glossary

## <Term>

<Precise definition in domain language. One or two sentences max.>

### Distinctions

- **<Term>** vs **<OtherTerm>**: <how they differ>

---

## <AnotherTerm>

...
```

### During any skill session

- **Challenge fuzzy language**: when the user uses a vague or overloaded term, propose a precise canonical name. "You said 'account' — do you mean Customer or User? Those are different things in the glossary."
- **Challenge conflicts**: when the user uses a term that contradicts an existing definition, call it out. "The glossary defines 'cancellation' as X, but you seem to mean Y — which is it?"
- **Update inline**: when a term is resolved, update `CONTEXT.md` immediately. Don't wait until the end.
- **Use the glossary vocabulary everywhere**: issue titles, test names, PR descriptions, variable names.

---

## ADRs — Architectural Decision Records

### When to offer an ADR

Only offer one when **all three** are true:

1. A real architectural decision was made (not just implementation detail)
2. A future agent or developer would likely re-litigate it without the record
3. The reason is load-bearing (not "not worth it right now" or self-evident)

Don't offer an ADR for ephemeral decisions. Do offer one when the user rejects a refactoring candidate with a real constraint — so future architecture reviews don't re-suggest the same thing.

### Format

```markdown
# ADR-NNNN: <Short title>

**Date:** YYYY-MM-DD  
**Status:** Accepted

## Context

<What was the situation that forced a decision?>

## Decision

<What was decided, in one or two sentences.>

## Consequences

- <What becomes easier>
- <What becomes harder or constrained>
```

### Numbering

Use the next sequential number. Zero-pad to 4 digits: `0001`, `0002`, etc.

---

## How other skills use this

At the start of any skill session that touches code or design:

1. Check if `CONTEXT.md` exists. If yes, read it and use its vocabulary.
2. Check `docs/adr/` for decisions in the area you're touching. Don't re-litigate them.
3. Update inline as the session progresses.
