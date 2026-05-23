---
name: writing-plans
description: Use when you have a spec or requirements for a multi-step task, before touching code
---

# Writing Plans

## Overview

Write implementation plans that are **macro in scope, atomic in execution**. Every plan starts with a high-level roadmap, then breaks down into **small, self-contained subtasks** that a subagent can pick up and run without reading the rest of the plan.

Assume the executor is a skilled developer but has **zero context** about the codebase, the problem domain, and even this plan. They may receive only their assigned subtask in isolation. Every subtask must contain everything needed to execute it.

**Announce at start:** "I'm using the writing-plans skill to create the implementation plan."

**Domain awareness:** Read `CONTEXT.md` (domain glossary) if it exists — use its vocabulary in task names, descriptions, and acceptance criteria.

**Context:** If working in an isolated worktree, it should have been created via the `using-git-worktrees` skill at execution time.

**Save plans to:**
- **Macro Plan:** `docs/plans/YYYY-MM-DD-<feature-name>/plan.md`
- **Task Files:** `docs/plans/YYYY-MM-DD-<feature-name>/task-NN-<short-name>.md` (one file per subtask)
- (User preferences for plan location override this default)

---

## 1. Macro Plan (The Roadmap)

Before writing any task details, define the **Macro Plan**: a short, numbered list of every atomic subtask with a one-line description and its goal.

This is the "table of contents" that lets anyone see the full picture at a glance. It lives in the **plan.md** file.

```markdown
## Macro Plan

| # | Name | Goal | File | Prereq | Parallel with | Type |
|---|------|------|------|--------|---------------|------|
| T1 | [Short name] | [One-line goal] | `task-01-<kebab-name>.md` | None | None | AFK |
| T2 | [Short name] | [One-line goal] | `task-02-<kebab-name>.md` | T1 | T3 | AFK |
| T3 | [Short name] | [One-line goal] | `task-03-<kebab-name>.md` | T1 | T2 | HITL |

**Type legend:** **AFK** = agent can implement and merge without human interaction. **HITL** = requires human decision, review, or external access.

## Required Skills

[Discovered via `find-skills` during planning. List every skill the executor must load before starting:]

- `test-driven-development` — mandatory for all code subtasks
- `<domain-skill-1>` — e.g., `react-best-practices`, `flutter-add-widget-test`, `hono-api-best-practices`
- `<domain-skill-2>` — ...
```

Rules for the Macro Plan:
- **Max 10–15 subtasks**. If you need more, the feature is too big — split it into separate plans.
- Each subtask is a **single, indivisible unit of work** (e.g., one function, one test file, one config change).
- Each subtask gets its own file: `task-NN-<short-kebab-name>.md`
- A subagent reading only the Macro Plan must understand what gets built and in what order.
- **Parallel with:** Tasks that have no shared files or prerequisites and can be executed simultaneously by different subagents. If blank, the task is sequential.
- **Type:** Every subtask must be tagged **AFK** or **HITL** (see below). Prefer AFK over HITL — design tasks so a human only needs to intervene when truly necessary.
- **Separation of Concerns:** If a feature involves both frontend and backend work, they MUST be split into separate, related tasks to avoid mixing responsibilities. For example, have one task for the backend API and a subsequent task for the frontend integration that depends on it. Maintain atomic, demonstrable steps but do not mix backend and frontend code in the same task.

### HITL vs AFK classification

Every subtask must be tagged in the Macro Plan table and in its own task file header.

| Tag | Meaning | Examples |
|-----|---------|---------|
| **AFK** | Agent implements and merges without human interaction | Write a function, add a route, write tests, update config |
| **HITL** | Requires human decision, review, or external access | Architecture decision, design review, manual QA, secret rotation, external service setup |

Rules:
- Default to **AFK**. Only use **HITL** when the task genuinely cannot proceed without a human.
- HITL tasks are checkpoints, not excuses to pause unnecessarily.
- A task that is AFK for implementation but HITL for final review should be split: one AFK implementation task, one HITL review task.

---

## 2. File Structure

Map out which files will be created or modified and what each one is responsible for. This is where decomposition decisions get locked in.

- Design units with clear boundaries and well-defined interfaces. Each file should have one clear responsibility.
- You reason best about code you can hold in context at once, and your edits are more reliable when files are focused. Prefer smaller, focused files over large ones that do too much.
- Files that change together should live together. Split by responsibility, not by technical layer.
- In existing codebases, follow established patterns. If the codebase uses large files, don't unilaterally restructure — but if a file you're modifying has grown unwieldy, including a split in the plan is reasonable.

---

## 3. Discover and Annotate Required Skills

**Before writing subtask details, discover the optimal skill set for this plan:**

1. **Load `find-skills`** using the `Skill` tool.
2. **Run discovery searches** based on the plan's domain, tech stack, and tasks. Examples:
   - React/Next.js UI → search "react", "nextjs", "frontend design"
   - Flutter mobile app → search "flutter", "widget test", "responsive layout"
   - Hono API backend → search "hono", "api", "backend"
   - JSON serialization → search "json", "serialization", "model"
   - Routing/navigation → search "routing", "navigation", "router"
3. **Review search results** and identify skills that are relevant, high-quality (1K+ installs), and from reputable sources.
4. **Annotate skills in the plan:** For every subtask that benefits from a domain-specific skill, add a `**Skills:**` field listing the exact skill names to load.

### Why this matters

The executor (`executing-plans`) will also run `find-skills`, but if the **plan author** (you) annotates skills during planning:
- The executor doesn't need to guess which skills apply to which subtask.
- Subagents receive explicit instructions: *"Load `react-best-practices` before starting this subtask."*
- The plan becomes self-documenting about its own tooling requirements.

### Skill annotation in task files

Add a `**Skills:**` field to every task file that needs domain-specific guidance:

```markdown
# Task N: [Component Name]

**Goal:** ...

**Files:** ...

**Skills:**
- `react-best-practices` — for component structure and memoization rules
- `test-driven-development` — for TDD cycle enforcement

**Prerequisites:** ...
```

If no domain-specific skills apply, write:
```markdown
**Skills:** None (only `test-driven-development` is loaded implicitly)
```

---

## 4. TDD by Default

**Every task that writes or modifies application/business logic MUST follow TDD: red → green → refactor.**

The `test-driven-development` skill is always loaded implicitly when this plan is executed. If a business-logic task does not follow TDD, it is a plan bug.

### Task Classification

| Task Type | TDD Required? | Examples |
|-----------|---------------|----------|
| **Business Logic** | ✅ Mandatory | New functions, models, services, algorithms |
| **Tests** | ✅ Mandatory | Unit tests, integration tests, e2e tests |
| **Configuration** | ❌ Optional | Update `package.json`, add env vars, tweak CI config |
| **Documentation** | ❌ Optional | Update README, add code comments, write guides |
| **Wiring / Plumbing** | ❌ Optional but encouraged | Connect adapter to service, register route, import module |
| **Refactor (no behavior change)** | ❌ Optional | Rename variables, extract function, reorder imports |

### Rules for Non-TDD Tasks

Even when TDD is optional:
1. The task must still have a **verification step** (e.g., "Run the app and confirm it starts", "Generate docs and check formatting").
2. The task must still have a **Definition of Done** checklist.
3. If a non-TDD task unexpectedly requires code changes, those code changes MUST follow TDD.

### What remains forbidden
- "Implement X" without any form of verification (test or manual).
- "Add tests later" or "TODO: tests".
- Writing production code for business logic before a failing test.

### Task File Template (TDD-first + skill-annotated)

Each subtask lives in its own file (`task-NN-<kebab-name>.md`). This keeps tasks self-contained and prevents context bloat.

```markdown
# Task N: [Component Name]

**Goal:** [One sentence: what this task produces when done]

**Type:** AFK | HITL

**Files:**
- Create: `exact/path/to/file.py`
- Modify: `exact/path/to/existing.py:123-145`
- Test: `tests/exact/path/to/test.py`

**Task Type:** Business Logic | Configuration | Documentation | Wiring | Refactor

**Skills:**
- List every `<skill-name>` the executor must load before starting this task.
- Include domain-specific skills discovered via `find-skills` (e.g., `react-best-practices`, `flutter-add-widget-test`).
- Always include `test-driven-development` if this task writes/modifies code.
- If none beyond implicit TDD, write: `test-driven-development` (implicit)

**Visual Reference (if frontend/UI task):**
- `docs/mocks/<screen-name>.html` — the mock file/screen this task must replicate.
- If no mock exists or task is not UI-related, write: "None."

**Blocked by:** [List task IDs that must be complete before this task can start, e.g. "T1, T2". If none, write "None — can start immediately."] 

**Context for the executor:** [2–3 sentences explaining WHY this task exists and how it fits into the bigger picture. The executor has not read the rest of the plan.]

## Acceptance criteria
- [ ] [Specific, verifiable outcome — e.g., "GET /users returns 200 with a list of users"]
- [ ] [Another measurable criterion — e.g., "Unit tests cover happy path and error case"]
- [ ] [End-to-end slice criterion — e.g., "Feature is demonstrable without completing any other task"]

**Steps (TDD cycle):**

- [ ] **Step 1: RED — Write the failing test (CONTRACT)**

Describe the **test strategy and scenarios**, not the exact literal test code. Provide a clear description of the behavior the test must enforce (the contract).

Requirements:
- Describe the expected inputs and outputs.
- Outline the edge cases to cover.
- Do NOT write literal test code or literal development code here.

- [ ] **Step 2: GREEN — Implement to pass the test (STRATEGY)**

Describe the **approach and constraints**, not the exact code. The implementer is a skilled developer who will find the best way to satisfy the contract.

Requirements:
- Must handle [edge case X]
- Should follow [pattern Y] per loaded skill conventions
- Must pass the RED test above

**Do NOT include:** Exact implementation code, specific variable names, or algorithmic details. Those are discovered during execution.

- [ ] **Step 3: REFACTOR (if needed)**

[Optional. Only include if there is a specific cleanup requirement or pattern to apply.]

- [ ] **Step 4: Verify and commit**

Run all tests. Expected: PASS.
Commit with a descriptive message.
```

**Definition of Done:**
- [ ] All RED tests pass
- [ ] Code follows conventions of loaded skills
- [ ] No regressions in existing tests
- [ ] Committed with descriptive message
- [ ] (If applicable) Documentation updated

### What "TDD by default" forbids:
- Subtasks that say "implement X" without a preceding failing test.
- Subtasks that say "write tests for X" after X is already implemented.
- Subtasks that say "add tests later" or "TODO: tests".
- Steps that prescribe exact implementation code before the test is written.
- Steps that include exact implementation code in the GREEN phase. Pseudocode and constraints only.

### Atomicity Rules

**Every subtask must be:**
- **Small**: 2–10 minutes of work for a skilled developer. If it takes longer, split it.
- **Self-contained**: Contains ALL code, commands, file paths, and context needed. The executor must never need to look at another subtask to understand what to do.
- **Deterministic**: Exact inputs, exact expected outputs, exact commands. No ambiguity.
- **Reviewable**: When the subagent says "done," you can verify it by running one command or checking one file.

**What "self-contained" means:**
- If a subtask uses a function defined in a previous subtask, it must include that function's signature and a one-line explanation of what it does.
- If a subtask modifies a file that was created earlier, it must include the full file path and describe what already exists.
- Never say "same as Task 3" or "similar to above." Repeat the code.
- Never say "use the helper from T1" without showing what that helper is.
- The **test code (RED)** must NOT be literal code. Describe the scenarios, inputs, outputs, and edge cases to test.
- The **implementation approach (GREEN)** must describe constraints and requirements, not exact production code.

---

## 4. Granularity Examples

### Bad (too big, vague)
> T1: "Implement the user authentication module"
> T2: "Write tests for authentication"

### Good (atomic, self-contained)
> T1: "Create `User` model with `username` and `password_hash` fields"  
> T2: "Write `hash_password(password)` utility using bcrypt"  
> T3: "Implement `create_user(username, password)` service function"  
> T4: "Write unit tests for `create_user` (happy path + duplicate username)"  
> T5: "Implement `authenticate_user(username, password)` service function"  
> T6: "Write unit tests for `authenticate_user` (valid/invalid credentials)"

---

## 5. No Placeholders

Every step must contain the actual content an engineer needs. These are **plan failures** — never write them:
- "TBD", "TODO", "implement later", "fill in details"
- "Add appropriate error handling" / "add validation" / "handle edge cases"
- "Write tests for the above" (without actual test code)
- "Similar to Task N" (repeat the code — the engineer may be reading tasks out of order)
- Steps that describe what to do without showing how (code blocks required for code steps)
- References to types, functions, or methods not defined in the current subtask

---

## 6. Self-Review

After writing the complete plan, run this checklist on yourself:

### 6.1 Spec Coverage
Skim each section/requirement in the spec. Can you point to a subtask that implements it? List any gaps and add subtasks.
- Does the spec have all mandatory sections from the Spec Template (Problem, FRs, ACs, Constraints, Out of Scope)?
- Is every Functional Requirement mapped to at least one task?
- Are the Acceptance Criteria measurable and unambiguous?

### 6.2 Skill and Visual Reference Annotation Check
**For every task file:**
1. Does it have a `**Skills:**` field?
2. Are the listed skills relevant to the task's domain?
3. Did you discover these skills via `find-skills` during planning, or are they just generic defaults?
4. Are the skill names exact (e.g., `react-best-practices`, not just "React skill")?
5. **If the task involves UI/frontend:** Does it have a `**Visual Reference:**` field pointing to the correct mock file in `docs/mocks/`?
6. Does the task have a `**Definition of Done**` field?
7. Does the task have a `**Task Type**` field?
8. Does the task have a `**Type:**` field tagged as AFK or HITL?
9. Does the task have a `**Blocked by:**` field listing its dependencies (or explicitly stating "None — can start immediately")?
10. Does the task have an `## Acceptance criteria` section with at least one checkbox?
11. Does the Macro Plan table include the **Type** column for every task?

**If a task file lacks any of these fields, fix them.** The executor relies on these annotations.

### 6.3 TDD Compliance Scan
**For every task file that writes or modifies code:**
1. Does the task start with a failing test (RED step)?
2. Does it have a descriptive implementation step (GREEN step)?
3. Is there any task that implements code before writing a test?
4. Is there any "write tests for X" that comes AFTER an "implement X"?
5. Does the GREEN step avoid exact implementation code (approach only)?

**If any task violates TDD, rewrite it.** This is a plan-blocking issue.

### 6.4 Macro Plan Sanity Check
Read only the Macro Plan (`plan.md`). Does the full feature make sense? Is the order logical? Are there any tasks that could be parallelized?
- Can any two tasks with `**Parallel with:**` values be safely executed out of order?
- Do parallel tasks truly have no file conflicts or shared state?

### 6.5 Placeholder Scan
Search your task files for red flags — any of the patterns from the "No Placeholders" section above. Fix them.

### 6.6 Subagent Isolation Test
Pick a random task file and read it in isolation (pretend you know nothing about the rest of the plan). Can you execute it? If not, add missing context. **Verify the `**Skills:**` field is sufficient for the subagent to load everything it needs.**

### 6.7 Type Consistency
Do the types, method signatures, and property names you used in later task files match what you defined in earlier ones? A function called `clearLayers()` in `task-03-*.md` but `clearFullLayers()` in `task-07-*.md` is a bug.

### 6.8 Dependency Check
- Does every task correctly list its prerequisites?
- Does every task have a `**Blocked by:**` field that matches the Macro Plan's Prereq column?
- Are tasks ordered so that blockers come before the tasks that depend on them?
- Are `**Parallel with:**` assignments accurate (no hidden file conflicts)?
- Is the execution order logical? Could parallel tasks start earlier?

### 6.9 Implementation Literalness Check
**For every task that writes/modifies code:**
- Does the RED step describe the test scenarios instead of providing literal, executable test code?
- Does the GREEN step describe the approach (NOT exact implementation code)?
- Is there any exact production code in the GREEN phase? If yes, remove it.

If you find issues, fix them inline. No need to re-review — just fix and move on.

---

## Scope Change Protocol

During execution, the implementer or user may discover that the spec or plan needs adjustment. **Do NOT modify the original spec or task files directly.** Instead:

### Discovery during execution
1. Trivial change (typo, rename): fix inline, mention in commit.
2. Non-trivial (different approach, new file): STOP, report to controller.
3. Controller decides: minor fix → continue; major divergence → create `spec-v2.md` or `plan-v2.md`.

### User requests changes mid-implementation
1. STOP execution. Do not "just add it quickly."
2. Document the change.
3. If fits within existing spec: amend spec, update affected task files.
4. If new scope: create NEW spec and plan for next iteration.
5. Resume only after user approves updated spec/plan.

### Versioning
- Specs: `YYYY-MM-DD-<topic>-design.md`, then `YYYY-MM-DD-<topic>-design-v2.md`
- Plans: `YYYY-MM-DD-<feature>/plan.md`, then `YYYY-MM-DD-<feature>/plan-v2.md`
- Never overwrite originals. Preserve history.

---

## 7. Execution Handoff

After saving the plan, offer execution choice:

**"Plan complete and saved to `docs/plans/<feature-name>/`. Two execution options:**

**1. Subagent-Driven (recommended)** — I dispatch one subagent per task from the Macro Plan. Each subagent reads only its assigned `task-NN-*.md` file in full isolation. Fast iteration, parallelizable where possible.

**2. Inline Execution** — I execute tasks sequentially in this session using `executing-plans`, with checkpoints for review.

**Which approach?"**

**If Subagent-Driven chosen:**
- **REQUIRED SUB-SKILL:** Use `subagent-driven-development`
- Fresh subagent per task + two-stage review
- **Critical:** The controller MUST read each `task-NN-*.md` file and pass its full contents (including the `**Skills:**` annotations) to the implementer subagent. The subagent does not read the plan directory — it only receives its isolated task file contents. If the Skills list is missing from the prompt, the subagent won't load domain-specific conventions.

**If Inline Execution chosen:**
- **REQUIRED SUB-SKILL:** Use `executing-plans`
- Batch execution with checkpoints for review
- The executor reads the Macro Plan (`plan.md`) first, then each `task-NN-*.md` file in order.
- The executor will run `find-skills` as a safety net and enforce TDD automatically.
