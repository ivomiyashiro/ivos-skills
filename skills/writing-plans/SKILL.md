---
name: writing-plans
description: Use when you have a spec or requirements for a multi-step task, before touching code
---

# Writing Plans

## Overview

Write implementation plans that are **macro in scope, atomic in execution**. Every plan starts with a high-level roadmap, then breaks down into **small, self-contained subtasks** that a subagent can pick up and run without reading the rest of the plan.

Assume the executor is a skilled developer but has **zero context** about the codebase, the problem domain, and even this plan. They may receive only their assigned subtask in isolation. Every subtask must contain everything needed to execute it.

**Announce at start:** "I'm using the writing-plans skill to create the implementation plan."

**Context:** If working in an isolated worktree, it should have been created via the `superpowers:using-git-worktrees` skill at execution time.

**Save plans to:** `docs/superpowers/plans/YYYY-MM-DD-<feature-name>.md`
- (User preferences for plan location override this default)

---

## 1. Macro Plan (The Roadmap)

Before writing any task details, define the **Macro Plan**: a short, numbered list of every atomic subtask with a one-line description and its goal.

This is the "table of contents" that lets anyone see the full picture at a glance.

```markdown
## Macro Plan

1. **T1: [Short name]** — [One-line goal]
2. **T2: [Short name]** — [One-line goal]
3. **T3: [Short name]** — [One-line goal]
...

## Required Skills

[Discovered via `find-skills` during planning. List every skill the executor must load before starting:]

- `superpowers:test-driven-development` — mandatory for all code subtasks
- `superpowers:<domain-skill-1>` — e.g., `react-best-practices`, `flutter-add-widget-test`, `hono-api-best-practices`
- `superpowers:<domain-skill-2>` — ...
```

Rules for the Macro Plan:
- **Max 10–15 subtasks**. If you need more, the feature is too big — split it into separate plans.
- Each subtask is a **single, indivisible unit of work** (e.g., one function, one test file, one config change).
- A subagent reading only the Macro Plan must understand what gets built and in what order.

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

1. **Load `superpowers:find-skills`** using the `Skill` tool.
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
- Subagents receive explicit instructions: *"Load `superpowers:react-best-practices` before starting this subtask."*
- The plan becomes self-documenting about its own tooling requirements.

### Skill annotation in subtasks

Add a `**Skills:**` field to every subtask that needs domain-specific guidance:

```markdown
### Subtask N: [Component Name]

**Goal:** ...

**Files:** ...

**Skills:**
- `superpowers:react-best-practices` — for component structure and memoization rules
- `superpowers:test-driven-development` — for TDD cycle enforcement

**Prerequisites:** ...
```

If no domain-specific skills apply, write:
```markdown
**Skills:** None (only `superpowers:test-driven-development` is loaded implicitly)
```

---

## 4. TDD by Default

**Every subtask that writes or modifies code MUST follow the TDD cycle: red → green → refactor.**

This is non-negotiable. The `test-driven-development` skill is always loaded implicitly when this plan is executed. If a subtask does not follow TDD, it is a plan bug.

### What this means in practice:
- **Red**: The first step of any code subtask is a failing test that defines the expected behavior.
- **Green**: The next step is the minimal implementation that makes the test pass.
- **Refactor**: If the subtask has more than one test or the code needs cleanup, include a refactor step.
- **No exceptions**: Even "infrastructure" subtasks (config, wiring, adapters) get a test first. If you genuinely cannot write a meaningful test for a subtask, that subtask is too vague — split it until you can.

### Subtask template (TDD-first + skill-annotated):

```markdown
### Subtask N: [Component Name]

**Goal:** [One sentence: what this subtask produces when done]

**Files:**
- Create: `exact/path/to/file.py`
- Modify: `exact/path/to/existing.py:123-145`
- Test: `tests/exact/path/to/test.py`

**Skills:**
- List every `superpowers:<skill-name>` the executor must load before starting this subtask.
- Include domain-specific skills discovered via `find-skills` (e.g., `react-best-practices`, `flutter-add-widget-test`).
- Always include `superpowers:test-driven-development` if this subtask writes/modifies code.
- If none beyond implicit TDD, write: `superpowers:test-driven-development` (implicit)

**Prerequisites (if any):** [Only list direct prerequisites — things that MUST exist before this subtask starts. If none, write "None."]

**Context for the executor:** [2–3 sentences explaining WHY this subtask exists and how it fits into the bigger picture. The executor has not read the rest of the plan.]

**Steps (TDD cycle):**

- [ ] **Step 1: RED — Write the failing test**

```python
def test_specific_behavior():
    result = function(input)
    assert result == expected
```

- [ ] **Step 2: Verify RED — Run and confirm it fails**

Run: `pytest tests/path/test.py::test_name -v`
Expected: FAIL with "function not defined"

- [ ] **Step 3: GREEN — Write minimal implementation**

```python
def function(input):
    return expected
```

- [ ] **Step 4: Verify GREEN — Run and confirm it passes**

Run: `pytest tests/path/test.py::test_name -v`
Expected: PASS

- [ ] **Step 5: REFACTOR (if needed)**

[Only if the code needs cleanup, better naming, or extraction. Include exact refactored code.]

- [ ] **Step 6: Commit**

```bash
git add tests/path/test.py src/path/file.py
git commit -m "feat: add specific feature"
```
```

### What "TDD by default" forbids:
- Subtasks that say "implement X" without a preceding failing test.
- Subtasks that say "write tests for X" after X is already implemented.
- Subtasks that say "add tests later" or "TODO: tests".
- Steps that show implementation code before any test code.

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

### 6.2 Skill Annotation Check
**For every subtask:**
1. Does it have a `**Skills:**` field?
2. Are the listed skills relevant to the subtask's domain?
3. Did you discover these skills via `find-skills` during planning, or are they just generic defaults?
4. Are the skill names exact (e.g., `superpowers:react-best-practices`, not just "React skill")?

**If a subtask lacks skill annotations or has incorrect ones, fix them.** The executor relies on these annotations to load the right skills.

### 6.3 TDD Compliance Scan
**For every subtask that writes or modifies code:**
1. Does the subtask start with a failing test (RED step)?
2. Does it have a minimal implementation step (GREEN step)?
3. Is there any subtask that implements code before writing a test?
4. Is there any "write tests for X" that comes AFTER an "implement X"?

**If any subtask violates TDD, rewrite it.** This is a plan-blocking issue.

### 6.4 Macro Plan Sanity Check
Read only the Macro Plan. Does the full feature make sense? Is the order logical? Are there any subtasks that could be parallelized?

### 6.5 Placeholder Scan
Search your plan for red flags — any of the patterns from the "No Placeholders" section above. Fix them.

### 6.6 Subagent Isolation Test
Pick a random subtask and read it in isolation (pretend you know nothing about the rest of the plan). Can you execute it? If not, add missing context. **Verify the `**Skills:**` field is sufficient for the subagent to load everything it needs.**

### 6.7 Type Consistency
Do the types, method signatures, and property names you used in later subtasks match what you defined in earlier ones? A function called `clearLayers()` in T3 but `clearFullLayers()` in T7 is a bug.

If you find issues, fix them inline. No need to re-review — just fix and move on.

---

## 7. Execution Handoff

After saving the plan, offer execution choice:

**"Plan complete and saved to `docs/superpowers/plans/<filename>.md`. Two execution options:**

**1. Subagent-Driven (recommended)** — I dispatch one subagent per subtask from the Macro Plan. Each subagent receives only its assigned subtask in full isolation. Fast iteration, parallelizable where possible.

**2. Inline Execution** — I execute subtasks sequentially in this session using `executing-plans`, with checkpoints for review.

**Which approach?"**

**If Subagent-Driven chosen:**
- **REQUIRED SUB-SKILL:** Use `superpowers:subagent-driven-development`
- Fresh subagent per subtask + two-stage review
- **Critical:** The controller MUST extract the `**Skills:**` annotations from each subtask and include them in the implementer prompt. The subagent cannot see the full plan — it only receives its isolated subtask. If the Skills list is missing from the prompt, the subagent won't load domain-specific conventions.

**If Inline Execution chosen:**
- **REQUIRED SUB-SKILL:** Use `superpowers:executing-plans`
- Batch execution with checkpoints for review
- The executor will run `find-skills` as a safety net and enforce TDD automatically.
