---
name: prototype
description: Build throwaway code to answer ONE design question before committing to it. Use when the user wants to prototype, sanity-check a data model or state machine, mock up a UI, or says "prototype this", "let me play with it", "try a few designs", "validate this idea".
---

# Prototype

A prototype is **throwaway code that answers one question**. That question decides everything.

## Pick a branch

Identify which question is being answered from the user's prompt or surrounding code. Ask if unclear.

- **"Does this logic / state model feel right?"** → [LOGIC branch](#logic-branch). Build a tiny interactive terminal app that pushes the state machine through cases hard to reason about on paper.
- **"What should this look like?"** → [UI branch](#ui-branch). Generate several radically different UI variations on a single route, switchable via a URL search param and a floating bottom bar.

Getting this wrong wastes the whole prototype. If genuinely ambiguous and the user is AFK, pick the branch that matches the surrounding code (backend module → logic; page or component → UI) and state the assumption at the top.

---

## Rules for both branches

1. **Throwaway from day one.** Name it so a casual reader knows instantly. Locate it near the code it's prototyping so context is obvious (`feature-name.prototype.ts`, `routes/proto-checkout.tsx`).
2. **One command to run.** Use whatever the project's task runner supports: `pnpm proto`, `bun run proto/index.ts`, `python proto/main.py`. No setup docs, no onboarding.
3. **No persistence by default.** State lives in memory. If the question explicitly involves a database, hit a scratch DB or local file clearly named `PROTOTYPE-wipe-me.db`.
4. **Skip the polish.** No tests, no error handling beyond what makes it runnable, no abstractions. The point is to learn fast, then delete.
5. **Surface the state.** After every action (logic) or on every variant switch (UI), print or render the full relevant state so the user can see what changed.
6. **Delete or absorb when done.** When the prototype has answered its question, delete it or fold the validated decision into real code. Don't leave it rotting.

---

## LOGIC branch

Build a minimal **interactive terminal app** that lets the user push the state machine through scenarios that are hard to reason about on paper.

### Structure

```
<feature>/
└── proto/
    └── index.ts     # single entry point, one command to run
```

### What to build

- **State machine or data model** that reflects the design question
- **Menu loop**: numbered options → user picks → state updates → full state printed
- **Preset scenarios**: 2–3 auto-runnable sequences that hit the tricky cases (e.g., "cancel an already-shipped order")
- **No business logic in the display layer** — keep them separate so the user can see the model clearly

### Example loop

```
Current state: { status: "pending", items: 3, total: 120 }

1. Add item
2. Remove item
3. Checkout
4. Cancel
5. Run preset: partial-cancel scenario
> _
```

### Done signal

The user says "this feels right" or "this doesn't work because X." Capture the answer (see [When done](#when-done)).

---

## UI branch

Generate several **radically different UI variations** on a single route, switchable live so the user can compare them without rebuilding.

### Structure

Use the project's existing routing convention. Don't invent a new top-level structure.

```
# Next.js example
app/proto-<feature>/page.tsx

# React Router example
src/routes/proto-<feature>.tsx
```

### What to build

- **2–4 variations** that are genuinely different (layout, density, interaction model) — not just color tweaks
- **URL search param switcher**: `?variant=a|b|c|d`
- **Floating bottom bar** always visible: shows current variant name + links to all variants. Simple fixed `div`, no dependencies.
- **Realistic but fake data**: hardcoded fixtures, no API calls. If the question is about data fetching, mock the hook.
- **Each variant explores a different design hypothesis**, e.g.: dense list vs card grid; inline edit vs modal; wizard vs single form.

### Switcher bar example

```
[ Variant A — List ] [ Variant B — Cards ] [ Variant C — Table ]   ← floating bar at bottom
```

### Done signal

The user picks a direction. Capture the answer (see [When done](#when-done)).

---

## When done

The answer is the only thing worth keeping. Before deleting the prototype, capture it somewhere durable:

- **Commit message** on the commit that removes it: "proto: validated X, chose Y because Z"
- **Issue / PR description** if it informs upcoming work
- **`NOTES.md`** next to the prototype as a placeholder if the user is AFK

Then delete the prototype file(s).
