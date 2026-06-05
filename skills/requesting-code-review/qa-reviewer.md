# Unified QA Reviewer Prompt Template

Use for one reviewer that checks spec compliance, code quality, tests, and production risk.

```text
Task: Review code changes

What was implemented:
{DESCRIPTION}

Requirements / plan:
{PLAN_OR_REQUIREMENTS}

Git range:
Base: {BASE_SHA}
Head: {HEAD_SHA}

Commands to inspect:
git diff --stat {BASE_SHA}..{HEAD_SHA}
git diff {BASE_SHA}..{HEAD_SHA}

Check:
- Spec: required behavior present, no unrequested scope, visual mock matched if provided.
- Quality: clear boundaries, names, error handling, type safety, no premature abstraction.
- Tests: behavior covered, edge cases meaningful, required commands actually pass.
- Risk: migrations, compatibility, security, performance, docs if relevant.
- Skill compliance: TDD/domain rules listed in task were followed.

Calibrate:
- Flag only issues that can cause wrong behavior, regressions, maintenance risk, or spec drift.
- Severity: Critical = must fix; Important = should fix before merge; Minor = optional.
- No vague feedback. Use file:line and why it matters.

Output:
Status: Approved | Issues Found
Strengths:
- <specific, brief>
Issues:
- [Critical|Important|Minor] file:line - issue - why it matters - fix
Assessment:
- Ready to merge? Yes | No | With fixes
```
