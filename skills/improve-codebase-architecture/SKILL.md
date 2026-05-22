---
name: improve-codebase-architecture
description: Find architectural friction and deepening opportunities in a codebase. Use when the user wants to improve architecture, find refactoring opportunities, consolidate tightly-coupled modules, or make a codebase more testable.
---

# Improve Codebase Architecture

## Vocabulary

Use these terms exactly in all suggestions:

- **Module** — anything with an interface and an implementation (function, class, package, slice)
- **Interface** — everything a caller must know to use the module: types, invariants, error modes, ordering, config. Not just the type signature.
- **Implementation** — the code inside
- **Depth** — leverage at the interface: much behavior behind a small interface. **Deep** = high leverage. **Shallow** = interface nearly as complex as the implementation.
- **Seam** — where an interface lives; a point where behavior can be altered without editing in-place
- **Adapter** — something concrete that satisfies an interface at a seam
- **Leverage** — what callers gain from depth
- **Locality** — what maintainers gain from depth: changes, bugs, and knowledge concentrated in one place

## Key Principles

- **Deletion test**: imagine deleting the module. If the complexity disappears, it was a pass-through. If it reappears distributed across N callers, it was useful.
- **The interface IS the test surface**
- **One adapter = hypothetical seam. Two adapters = real seam.**

## Process

### 1. Explore

Read `CONTEXT.md` before starting. Use the Explore subagent to walk the codebase organically. Notice where friction lives:

- Does understanding a concept require jumping across many small modules?
- Are there shallow modules — interface nearly as complex as the implementation?
- Were pure functions extracted only for testability, while the real bugs hide in how they're called?
- What parts are hard to test through their current interface?

Apply the deletion test to anything that looks shallow.

### 2. Present Candidates

For each candidate, show a card:

- **Files** — which files/modules are involved
- **Problem** — why the current architecture creates friction
- **Solution** — plain-English description of what would change
- **Benefits** — in terms of locality and leverage, and how tests would improve
- **Recommendation strength** — `Strong`, `Worth exploring`, or `Speculative`

Close with **Top recommendation**: which one to tackle first and why.

Do NOT propose interfaces yet. Ask the user: "Which of these do you want to explore?"

### 3. Grilling Loop

Once the user picks a candidate, enter a grilling conversation. Walk the design tree: constraints, dependencies, shape of the deepened module, which tests would survive.

Apply side effects inline as decisions crystallize:

- If you name a deepened module with a concept not in `CONTEXT.md` → add it immediately (use the `domain-glossary` skill)
