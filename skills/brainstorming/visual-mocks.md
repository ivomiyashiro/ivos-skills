# Visual Mocks Guide

Guide for creating static HTML/CSS visual mocks during the brainstorming phase. These mocks are the approved visual contract that implementation tasks will reference.

## When to Use

Create visual mocks **after** the user approves the conceptual design and **before** writing the design doc or invoking writing-plans. This applies to any project that involves UI, web frontend, mobile screens, or visual components.

Skip only if:
- The user explicitly asks to skip visual mocks.
- The project has no visual surface (pure API, CLI tool, background job, etc.).

## Output

A single file:

```
docs/superpowers/mocks/index.html
```

CSS is embedded inside `<style>` in the same file. No external dependencies. No JavaScript.

## Rules

| Rule | Why |
|------|-----|
| **One file only** | Easy to open, review, and reference. No need to jump between files. |
| **Static HTML + CSS** | Opens in any browser with a double-click. No build step, no server needed. |
| **Storybook-style sections** | Each screen/component is a `<section>` with an `id`. Scroll to see everything. |
| **No interactivity** | No clicks, no hover effects, no JS. This is a visual spec, not a prototype. |
| **Faithful to approved design** | Must match the design the user already approved. Colors, fonts, spacing, layout. |
| **All relevant states** | Empty, loading, error, success, populated — include what matters for implementation. |

## Template

Use this as the starting point for every mock:

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Visual Mocks — PROJECT_NAME</title>
  <style>
    /* Base reset and layout */
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: system-ui, -apple-system, sans-serif;
      background: #f5f5f5;
      color: #111;
      line-height: 1.5;
    }

    /* Page wrapper */
    .mock-container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 40px 20px;
    }

    /* Each screen/component section */
    .mock-section {
      background: #fff;
      border-radius: 12px;
      padding: 32px;
      margin-bottom: 32px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.06);
    }

    .mock-section h2 {
      font-size: 14px;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: #666;
      margin-bottom: 24px;
      padding-bottom: 12px;
      border-bottom: 1px solid #eee;
    }

    /* Your component styles go here */
  </style>
</head>
<body>
  <div class="mock-container">

    <section class="mock-section" id="login-screen">
      <h2>Login Screen</h2>
      <!-- Login form markup here -->
    </section>

    <section class="mock-section" id="dashboard-screen">
      <h2>Dashboard Screen</h2>
      <!-- Dashboard markup here -->
    </section>

    <section class="mock-section" id="dashboard-empty-state">
      <h2>Dashboard — Empty State</h2>
      <!-- Empty state markup here -->
    </section>

  </div>
</body>
</html>
```

## Naming Sections

Use kebab-case IDs that clearly describe the screen or component:

- `id="login-screen"`
- `id="dashboard-screen"`
- `id="dashboard-empty-state"`
- `id="navbar-component"`
- `id="modal-delete-confirmation"`

These IDs will be referenced in task files as:
```markdown
**Visual Reference:** `docs/superpowers/mocks/index.html#login-screen`
```

## What to Include

### Always include
- Every distinct screen or page.
- Reusable components that appear in multiple places (navbar, sidebar, footer).
- Critical states that affect layout or structure (empty, loading, error).

### Skip if trivial
- A standard button in its default state (unless it has a unique, complex design).
- Simple text paragraphs without special styling.
- Things that are 100% standard HTML elements with no custom design.

### Example decisions
| Element | Include? | Reason |
|---------|----------|--------|
| Login form with custom styling | Yes | Custom layout, branded design. |
| Dashboard with data tables and charts | Yes | Complex layout, many elements. |
| Navbar with logo, links, avatar | Yes | Reused across screens, custom design. |
| Standard browser alert() dialog | No | Platform-native, not custom. |
| Loading spinner (simple CSS circle) | No | Trivial, 3 lines of CSS. |
| Loading skeleton for dashboard cards | Yes | Affects layout, custom structure. |

## Styling Tips

- **Use CSS variables** for colors and spacing so the mock is easy to adjust:
  ```css
  :root {
    --color-primary: #6366f1;
    --color-bg: #ffffff;
    --space-md: 16px;
  }
  ```
- **Keep it realistic but lightweight**: Use real content (names, titles, data) instead of "Lorem ipsum" when possible. It helps the user judge spacing and hierarchy.
- **Show the container bounds**: A light border or background color behind each section makes it clear where one component ends and another begins.
- **Responsive?** If the design has specific breakpoints, include a note in the section heading (e.g., `<h2>Login Screen — Desktop (1024px)</h2>`). You don't need to build the full responsive version unless it's critical.

## Iterating

If the user requests changes:
1. Create a new file: `index-v2.html`, `index-v3.html`, etc.
2. Never overwrite the approved version until the new one is accepted.
3. After approval, the latest version becomes the canonical reference. You may delete older versions or keep them for history.

## Relationship to Visual Companion

The **Visual Companion** (`visual-companion.md`) is a browser-based tool used *during* brainstorming to compare options, iterate on ideas, and get rapid feedback. It is interactive and exploratory.

**Visual Mocks** are the **final approved artifact** produced *after* brainstorming is complete. They are static, precise, and serve as the implementation spec. Think of the Visual Companion as the sketchpad and Visual Mocks as the blueprint.
