---
name: requesting-code-review
description: Use when completing tasks, implementing major features, or before merging to verify work meets requirements
---

# Requesting QA Review

Use a focused reviewer before issues cascade.

## When

- after Strict tasks in `subagent-driven-development`
- after major feature or complex bug fix
- before merge/PR
- when stuck and needing an independent read

## How

1. Compute range:
   ```bash
   BASE_SHA=<commit before work>
   HEAD_SHA=$(git rev-parse HEAD)
   ```
2. Dispatch reviewer with `qa-reviewer.md`.
3. Provide only: summary, requirements/task, base/head SHAs.
4. Fix Critical and Important issues before proceeding.
5. Push back only with evidence from code/tests.

## Rules

- Do not skip review because work seems simple if workflow requires it.
- Do not trust implementer reports; reviewers inspect the diff.
- Do not proceed with unresolved Critical/Important findings.
- Minor findings are advisory unless they hide real risk.
