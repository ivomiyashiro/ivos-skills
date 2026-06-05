---
name: test-driven-development
description: Use when implementing any feature or bugfix, before writing implementation code
---

# Test-Driven Development

## Iron Law

No production behavior without a failing test first.

Write code before the test? Delete it. Start over. Do not keep it as reference, adapt it, or "test after." Violating the letter violates the spirit.

## Use For

- New features
- Bug fixes
- Behavior changes
- Refactors that need safety

Ask before skipping for prototypes, generated code, or pure config.

## Cycle

1. **RED:** write one minimal test for one observable behavior.
2. **VERIFY RED:** run it; confirm it fails for the expected reason.
3. **GREEN:** write the smallest production code that passes.
4. **VERIFY GREEN:** run the focused test and relevant suite.
5. **REFACTOR:** clean names/duplication only while tests stay green.
6. Repeat one behavior at a time.

Vertical slices only: one test -> one implementation. Do not write all tests first and all code later.

## Test Quality

Good tests:
- verify behavior through public interfaces
- use real code unless mocks are unavoidable
- have clear scenario/result names
- cover meaningful edge/error cases
- survive internal refactors

Bad tests assert private calls, mock behavior, implementation shape, or multiple unrelated behaviors.

## When Stuck

| Problem | Move |
|---------|------|
| Unsure API | Write wished-for public API in the test first |
| Test setup huge | Simplify interface or extract test helpers |
| Need many mocks | Code is too coupled; add injection/adapters |
| Existing code lacks tests | Add characterization/regression test before change |

## Red Flags

- code before test
- test passes immediately
- "I'll test after"
- "manual testing is enough"
- "keep code as reference"
- "too simple to test"
- "all tests first, then implementation"
- test breaks on refactor without behavior change

Any red flag means stop and restart from RED.

## Before Completion

- [ ] every behavior change has a test
- [ ] each new test failed before implementation
- [ ] failures were expected, not typos/setup errors
- [ ] focused and relevant full checks pass
- [ ] output is clean or known warnings are documented

For detailed examples and anti-patterns, read `testing-anti-patterns.md`.
