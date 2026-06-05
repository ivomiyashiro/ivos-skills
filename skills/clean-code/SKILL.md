---
name: clean-code
description: 'Write readable, maintainable code through disciplined naming, small functions, and clean error handling. Use when the user mentions "code review", "naming conventions", "function too long", "code smells", "readable code", "boy scout rule", "single responsibility", or "unit test quality". Also trigger when reviewing pull requests for readability, refactoring messy functions, debating comment styles, or improving error handling patterns. Covers SRP, comment discipline, formatting, and unit testing. For refactoring techniques, see refactoring-patterns. For module-level architecture, deep modules, and seam design, see improve-codebase-architecture.'
license: MIT
metadata:
  author: wondelai
  version: "1.1.0"
---

# Clean Code

Optimize code for the next reader. Rate code 0-10 and name the smallest changes needed to reach 10/10.

## Core Checklist

| Area | 10/10 signal | If not |
|------|--------------|--------|
| Names | reveal intent, one word per concept | rename |
| Functions | small, one responsibility, few args | extract/split |
| Comments | explain why, not what | rename/extract/delete stale comments |
| Errors | separate from happy path, contextual, no null surprises | wrap/throw/return explicit result |
| Tests | behavior-focused, readable, fast, edge cases covered | add/rename/simplify tests |
| Smells | no duplication, magic numbers, dead code, feature envy | targeted refactor |

## Review Protocol

1. Score current code.
2. List only issues that affect readability, maintainability, correctness, or test confidence.
3. Give concrete file/line fixes.
4. Prefer small improvements in touched code; avoid unrelated rewrites.
5. If the problem is architectural/module-level, use `improve-codebase-architecture`.

## Quick Heuristics

- Comment needed to explain what code does -> better name/function.
- Boolean flag parameter -> split behavior.
- Many args -> parameter object/value object.
- Hard-to-test code -> interface is unclear or dependencies are coupled.
- Same logic 3 times -> extract.
- Refactor without tests -> add characterization tests first.

## References

- `references/naming-conventions.md`
- `references/functions-and-methods.md`
- `references/comments-formatting.md`
- `references/error-handling.md`
- `references/testing-principles.md`
- `references/code-smells.md`
