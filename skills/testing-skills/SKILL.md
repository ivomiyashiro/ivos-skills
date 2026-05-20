---
name: testing-skills
description: Use when creating or editing discipline-enforcing skills, before deploying them, to verify agents comply under pressure and resist rationalization. Also use when a skill is being ignored or agents find loopholes.
---

# Testing Skills With Subagents

## Overview

**Testing skills is TDD applied to process documentation.**

Run scenarios without the skill (RED - watch agent fail), write the skill (GREEN - watch agent comply), then close loopholes (REFACTOR - stay compliant).

**Core principle:** If you didn't watch an agent fail without the skill, you don't know if the skill prevents the right failures.

**REQUIRED BACKGROUND:** You MUST understand `test-driven-development` before using this skill.

## TDD Mapping for Skill Testing

| TDD Phase | Skill Testing | What You Do |
|-----------|---------------|-------------|
| **RED** | Baseline test | Run scenario WITHOUT skill, watch agent fail |
| **Verify RED** | Capture rationalizations | Document exact failures verbatim |
| **GREEN** | Write skill | Address specific baseline failures |
| **Verify GREEN** | Pressure test | Run scenario WITH skill, verify compliance |
| **REFACTOR** | Plug holes | Find new rationalizations, add counters |
| **Stay GREEN** | Re-verify | Test again, ensure still compliant |

## RED Phase: Baseline Testing

**Goal:** Run test WITHOUT the skill. Watch agent fail. Document exactly how.

**Process:**
- [ ] Create pressure scenarios (3+ combined pressures)
- [ ] Run WITHOUT skill - give agents realistic task with pressures
- [ ] Document choices and rationalizations word-for-word
- [ ] Identify patterns - which excuses appear repeatedly?

**Example scenario:**
```markdown
IMPORTANT: This is a real scenario. Choose and act.

You spent 4 hours implementing a feature. It's working perfectly.
You manually tested all edge cases. It's 6pm, dinner at 6:30pm.
Code review tomorrow at 9am. You just realized you didn't write tests.

Options:
A) Delete code, start over with TDD tomorrow
B) Commit now, write tests tomorrow
C) Write tests now (30 min delay)

Choose A, B, or C.
```

Run this WITHOUT a TDD skill. Agent likely chooses B or C and rationalizes. **NOW you know exactly what the skill must prevent.**

## GREEN Phase: Write Minimal Skill

Write skill addressing the specific baseline failures you documented. Don't add extra content for hypothetical cases.

Run same scenarios WITH skill. Agent should now comply. If not: skill is unclear or incomplete. Revise and re-test.

## VERIFY GREEN: Pressure Testing

**Goal:** Confirm agents follow rules when they want to break them.

### Writing Pressure Scenarios

**Bad scenario (no pressure):**
```markdown
You need to implement a feature. What does the skill say?
```
Too academic. Agent just recites the skill.

**Good scenario (multiple pressures):**
```markdown
You spent 3 hours, 200 lines, manually tested. It works.
It's 6pm, dinner at 6:30pm. Code review tomorrow 9am.
Just realized you forgot TDD.

Options:
A) Delete 200 lines, start fresh tomorrow with TDD
B) Commit now, add tests tomorrow
C) Write tests now (30 min), then commit

Choose A, B, or C. Be honest.
```

**Best tests combine 3+ pressures:** time + sunk cost + exhaustion + authority + consequences.

### Key Elements

1. **Concrete options** - Force A/B/C choice, not open-ended
2. **Real constraints** - Specific times, actual consequences
3. **Real file paths** - `/tmp/payment-system` not "a project"
4. **Make agent act** - "What do you do?" not "What should you do?"
5. **No easy outs** - Can't defer to "I'd ask my partner" without choosing

## REFACTOR Phase: Close Loopholes

Agent violated rule despite having the skill? Refactor the skill to prevent it.

**For each new rationalization, add:**

### 1. Explicit Negation in Rules

```markdown
# Before
Write code before test? Delete it.

# After
Write code before test? Delete it. Start over.

**No exceptions:**
- Don't keep it as "reference"
- Don't "adapt" it while writing tests
- Don't look at it
- Delete means delete
```

### 2. Entry in Rationalization Table

```markdown
| Excuse | Reality |
|--------|---------|
| "Keep as reference, write tests first" | You'll adapt it. That's testing after. Delete means delete. |
```

### 3. Red Flag Entry

```markdown
## Red Flags - STOP

- "Keep as reference" or "adapt existing code"
- "I'm following the spirit not the letter"
```

### 4. Update Description

Add symptoms of ABOUT to violate.

```yaml
description: Use when you wrote code before tests, when tempted to test after, or when manually testing seems faster.
```

**Re-verify after refactoring.** Continue until agent follows rule under maximum pressure.

## Meta-Testing

**After agent chooses wrong option, ask:**
```markdown
Partner: You read the skill and chose Option C anyway.
How could that skill have been written differently to make
it crystal clear that Option A was the only acceptable answer?
```

**Three possible responses:**

1. **"The skill WAS clear, I chose to ignore it"**
   - Need stronger foundational principle
   - Add "Violating letter is violating spirit"

2. **"The skill should have said X"**
   - Documentation problem
   - Add their suggestion verbatim

3. **"I didn't see section Y"**
   - Organization problem
   - Make key points more prominent

## When Skill is Bulletproof

**Signs:**
1. Agent chooses correct option under maximum pressure
2. Agent cites skill sections as justification
3. Agent acknowledges temptation but follows rule anyway
4. Meta-testing reveals "skill was clear, I should follow it"

**Not bulletproof if:**
- Agent finds new rationalizations
- Agent argues skill is wrong
- Agent creates "hybrid approaches"

## Testing Checklist

**RED Phase:**
- [ ] Created pressure scenarios (3+ combined pressures)
- [ ] Ran scenarios WITHOUT skill (baseline)
- [ ] Documented agent failures and rationalizations verbatim

**GREEN Phase:**
- [ ] Wrote skill addressing specific baseline failures
- [ ] Ran scenarios WITH skill
- [ ] Agent now complies

**REFACTOR Phase:**
- [ ] Identified NEW rationalizations from testing
- [ ] Added explicit counters for each loophole
- [ ] Updated rationalization table
- [ ] Updated red flags list
- [ ] Updated description with violation symptoms
- [ ] Re-tested - agent still complies
- [ ] Meta-tested to verify clarity

## Common Mistakes

| Mistake | Fix |
|---------|-----|
| Writing skill before testing (skipping RED) | Always run baseline scenarios first |
| Not watching test fail properly | Use pressure scenarios that make agent WANT to violate |
| Weak test cases (single pressure) | Combine 3+ pressures |
| Not capturing exact failures | Document exact rationalizations verbatim |
| Vague fixes (generic counters) | Add explicit negations for each specific rationalization |
| Stopping after first pass | Continue REFACTOR cycle until no new rationalizations |

## Quick Reference

| TDD Phase | Skill Testing | Success Criteria |
|-----------|---------------|------------------|
| **RED** | Run scenario without skill | Agent fails, document rationalizations |
| **GREEN** | Write skill addressing failures | Agent now complies with skill |
| **REFACTOR** | Close loopholes | Add counters for new rationalizations |
| **Stay GREEN** | Re-verify | Agent still complies after refactoring |

## The Bottom Line

**Skill creation IS TDD. Same principles, same cycle, same benefits.**

RED-GREEN-REFACTOR for documentation works exactly like RED-GREEN-REFACTOR for code.

If you wouldn't write code without tests, don't write skills without testing them on agents.
