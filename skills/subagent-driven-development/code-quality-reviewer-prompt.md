# Code Quality Reviewer Prompt Template

Use this template when dispatching a code quality reviewer subagent.

**Purpose:** Verify implementation is well-built (clean, tested, maintainable)

**Only dispatch after spec compliance review passes.**

```
Task tool (general-purpose):
  Use template at requesting-code-review/code-reviewer.md

  DESCRIPTION: [task summary, from implementer's report]
  PLAN_OR_REQUIREMENTS: Task N from [plan-file]
  BASE_SHA: [commit before task]
  HEAD_SHA: [current commit]
```

  **In addition to standard code quality concerns, the reviewer should check:**
- Does each file have one clear responsibility with a well-defined interface?
- Are units decomposed so they can be understood and tested independently?
- Is the implementation following the file structure from the Macro Plan (`plan.md`)?
- Did this implementation create new files that are already large, or significantly grow existing files? (Don't flag pre-existing file sizes — focus on what this change contributed.)
- **Domain skill compliance:** Did the implementer follow conventions from loaded skills? (e.g., if `react-best-practices` was loaded, check for memoization, event handler patterns, etc. If `flutter-add-widget-test` was loaded, check for proper WidgetTester usage.)
- **TDD compliance:** Did the implementer write failing tests first? Are there tests for every code change?

**Code reviewer returns:** Strengths, Issues (Critical/Important/Minor), Assessment
