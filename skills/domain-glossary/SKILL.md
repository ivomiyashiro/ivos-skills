---
name: domain-glossary
description: Maintain the project's domain glossary (CONTEXT.md). Use when starting work in a new project, when a domain term needs precision, or when vocabulary needs to be aligned. Reference this from other skills before touching code.
---

# Domain Glossary

Maintain the project's domain glossary. Read it before starting any skill. Update it inline as things crystallize — never batch.

## Structure

```
/
└── CONTEXT.md          ← domain glossary (terms only, no implementation)
```

Create the file **lazily**: only when you have something to write. Don't scaffold it upfront.

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

## How other skills use this

At the start of any skill session that touches code or design:

1. Check if `CONTEXT.md` exists. If yes, read it and use its vocabulary.
2. Update inline as the session progresses.
