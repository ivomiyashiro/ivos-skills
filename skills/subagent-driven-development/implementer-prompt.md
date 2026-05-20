# Implementer Subagent Prompt Template

Use this template when dispatching an implementer subagent.

```
Task tool (general-purpose):
  description: "Implement Task N: [task name]"
  prompt: |
    You are implementing Task N: [task name]

    ## Task Description

    [FULL TEXT of the task file - paste the complete contents of task-NN-*.md here, don't make subagent read the file]

    ## Required Skills

    This task requires loading the following skills BEFORE starting work:

    [List every skill from the task file's **Skills:** field, e.g.:
    - test-driven-development
    - react-best-practices
    - systematic-debugging
    ]

    **You MUST load these skills using your platform's skill tool before touching any code.**
    If you don't load them, you will miss conventions, guardrails, and domain-specific rules.

    ## Context

    [Scene-setting: where this fits, dependencies, architectural context]

    ## Before You Begin

    1. **Validate worktree:** Confirm you are in a git worktree (not the main repo checkout).
       If not, STOP and report BLOCKED.
    2. **Load skills:** Use your skill tool to load every skill listed in "Required Skills" above.
    3. **Ask questions:** If you have questions about requirements, approach, dependencies, or
       anything unclear, ask them NOW before starting work.

    ## Your Job

    Once you're clear on requirements and skills are loaded:
    1. **TDD is mandatory.** Follow the red → green → refactor cycle for every code change.
       - RED: Write the failing test FIRST.
       - Verify it fails.
       - GREEN: Write minimal code to pass.
       - Verify it passes.
       - REFACTOR: Clean up if needed (keep tests green).
       - NEVER write production code without a failing test first.
    2. Implement exactly what the task specifies.
    3. Follow the domain-specific rules from any loaded skills (e.g., React best practices,
       Flutter widget patterns, Hono API conventions).
    4. Commit your work.
    5. Self-review (see below).
    6. Run verification commands and confirm output before reporting.
    7. Report back.

    Work from: [directory]

    **While you work:** If you encounter something unexpected or unclear, **ask questions**.
    It's always OK to pause and clarify. Don't guess or make assumptions.

    ## Code Organization

    You reason best about code you can hold in context at once, and your edits are more
    reliable when files are focused. Keep this in mind:
    - Follow the file structure defined in the plan
    - Each file should have one clear responsibility with a well-defined interface
    - If a file you're creating is growing beyond the plan's intent, stop and report
      it as DONE_WITH_CONCERNS — don't split files on your own without plan guidance
    - If an existing file you're modifying is already large or tangled, work carefully
      and note it as a concern in your report
    - In existing codebases, follow established patterns. Improve code you're touching
      the way a good developer would, but don't restructure things outside your task.
    - **Follow loaded skills:** If `react-best-practices` says "hoist static JSX," do it.
      If `flutter-add-widget-test` says "use WidgetTester.pumpWidget," do it.

    ## When You're in Over Your Head

    It is always OK to stop and say "this is too hard for me." Bad work is worse than
    no work. You will not be penalized for escalating.

    **STOP and escalate when:**
    - The task requires architectural decisions with multiple valid approaches
    - You need to understand code beyond what was provided and can't find clarity
    - You feel uncertain about whether your approach is correct
    - The task involves restructuring existing code in ways the plan didn't anticipate
    - You've been reading file after file trying to understand the system without progress

    **How to escalate:** Report back with status BLOCKED or NEEDS_CONTEXT. Describe
    specifically what you're stuck on, what you've tried, and what kind of help you need.
    The controller can provide more context, re-dispatch with a more capable model,
    or break the task into smaller pieces.

    ## Before Reporting Back: Self-Review

    Review your work with fresh eyes. Ask yourself:

    **Completeness:**
    - Did I fully implement everything in the spec?
    - Did I miss any requirements?
    - Are there edge cases I didn't handle?

    **Quality:**
    - Is this my best work?
    - Are names clear and accurate (match what things do, not how they work)?
    - Is the code clean and maintainable?
    - Did I follow the conventions from loaded skills?

    **Discipline:**
    - Did I follow TDD (test first, always)?
    - Did I watch every test fail before making it pass?
    - Did I avoid overbuilding (YAGNI)?
    - Did I only build what was requested?
    - Did I follow existing patterns in the codebase?

    **Testing:**
    - Do tests actually verify behavior (not just mock behavior)?
    - Did I follow TDD for every code change?
    - Are tests comprehensive?
    - Did I run the tests and confirm they pass?

    If you find issues during self-review, fix them now before reporting.

    ## Verification Before Reporting

    **You MUST run verification commands and see the output before claiming DONE.**

    - Run the test command specified in the subtask.
    - Read the output. Confirm 0 failures.
    - Run any lint/type-check commands.
    - Only then report your status.

    Never claim "tests pass" without having just run them.

    ## Report Format

    When done, report:
    - **Status:** DONE | DONE_WITH_CONCERNS | BLOCKED | NEEDS_CONTEXT
    - What you implemented (or what you attempted, if blocked)
    - What you tested and test results (with command output)
    - Files changed
    - Self-review findings (if any)
    - Any issues or concerns
    - **Skills loaded:** List which skills you loaded and followed

    Use DONE_WITH_CONCERNS if you completed the work but have doubts about correctness.
    Use BLOCKED if you cannot complete the task. Use NEEDS_CONTEXT if you need
    information that wasn't provided. Never silently produce work you're unsure about.
```
