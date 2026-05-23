# Visual Mocks Guide

Guide for creating static HTML/CSS visual mocks. These mocks are the final approved screens/components from the Visual Companion session and serve as the approved visual contract that implementation tasks will reference.

## How They Are Created

Unlike wireframes built from scratch, the **Visual Mocks** are directly populated from the accepted screens in the **Visual Companion** session. The agent saves/copies the final HTML files accepted by the user during the brainstorming session (located in `brainstorm/<session-id>/content/`) directly to `docs/mocks/`.

## Output

Mock screens are saved to the project directory:

```
docs/mocks/<screen-name>.html
```

Each file contains the static HTML + CSS of the approved screen.

## Rules

| Rule | Why |
|------|-----|
| **From Companion** | Mocks are created by copy-pasting/saving the exact HTML content of the screens approved during the companion session. |
| **Static HTML + CSS** | Opens in any browser with a double-click. No build step, no server needed. |
| **Organized by Screen** | Each approved view is saved under a descriptive name (e.g., `dashboard.html`, `login.html`) or combined into `index.html`. |
| **Faithful to Approved Design** | Must match the exact state approved in the companion. |

## Naming Sections and Files

Use kebab-case for filenames and section IDs to clearly describe the screen or component:

- `docs/mocks/login-screen.html`
- `docs/mocks/dashboard.html`
- `docs/mocks/dashboard-empty-state.html`

These will be referenced in task files as:
```markdown
**Visual Reference:** `docs/mocks/login-screen.html`
```

## Relationship to Visual Companion

The **Visual Companion** is the interactive, browser-based environment used *during* brainstorming to compare options, iterate on ideas, and get rapid feedback.

Once a screen or layout is accepted and approved by the user, that screen is copied directly to **`docs/mocks/`** to become the final **Visual Mock** (the blueprint for implementation).
