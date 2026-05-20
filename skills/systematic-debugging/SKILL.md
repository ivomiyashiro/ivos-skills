---
name: systematic-debugging
description: Use when encountering any bug, test failure, or unexpected behavior, before proposing fixes
---

# Systematic Debugging

## Overview

Random fixes waste time and create new bugs. Quick patches mask underlying issues.

**Core principle:** ALWAYS build a feedback loop before attempting fixes. Without a loop, you are guessing.

**Violating the letter of this process is violating the spirit of debugging.**

**Domain awareness:** Read `CONTEXT.md` (domain glossary) if it exists — use its vocabulary to understand the modules and concepts involved in the bug.

## The Iron Law

```
NO FIXES WITHOUT A FEEDBACK LOOP FIRST
```

If you haven't built a loop that reproduces the failure, you cannot propose fixes.

## When to Use

Use for ANY technical issue:
- Test failures
- Bugs in production
- Unexpected behavior
- Performance problems
- Build failures
- Integration issues

**Use this ESPECIALLY when:**
- Under time pressure (emergencies make guessing tempting)
- "Just one quick fix" seems obvious
- You've already tried multiple fixes
- Previous fix didn't work
- You don't fully understand the issue

**Don't skip when:**
- Issue seems simple (simple bugs have root causes too)
- You're in a hurry (rushing guarantees rework)
- Manager wants it fixed NOW (systematic is faster than thrashing)

## The Five Phases

You MUST complete each phase before proceeding to the next.

---

### Phase 0: Build a Feedback Loop (THE CORE SKILL)

**This is the most important phase. Everything else is secondary.**

A feedback loop is a repeatable, automated sequence that:
1. Triggers the bug
2. Signals clearly whether it reproduced (pass/fail, not "didn't crash")
3. Runs fast enough that you can iterate

**Without a loop, every hypothesis test is manual, slow, and unreliable.**

#### The 10 Loop Forms (in order of preference)

Choose the highest one you can build given your access to the system:

1. **Failing test at the seam that touches the bug** — unit or integration test that asserts the exact bad behavior. Fastest iteration, most deterministic. Use the `test-driven-development` skill.

2. **Curl / HTTP script against a running dev server** — a shell script that hits the endpoint and asserts the response (status code, body field, header). Commit it; it becomes regression coverage.

3. **CLI invocation with a fixture input, diff stdout against a known snapshot** — run the binary with a fixed input file, capture output, compare to expected. `diff <(./bin args < fixture.txt) expected.txt`

4. **Headless browser script (Playwright / Puppeteer)** — when the bug is browser-side and cannot be isolated to an API. Record the minimal click sequence, assert on DOM state or network response.

5. **Replay a captured trace** — save a real HTTP request to disk (HAR, raw curl command, recorded fixture), replay it in the loop. Decouples you from needing the live environment.

6. **Throwaway harness — minimal subset of the system** — copy only the files that touch the bug path into a scratch directory. Remove all unrelated dependencies until you have the smallest program that reproduces.

7. **Property / fuzz loop** — when the input space is large, generate 1000 random inputs and search for failure. `for i in $(seq 1000); do ./gen_input | ./bin || break; done`

8. **Bisection harness** — `git bisect run ./your_loop_script`. Lets git binary-search the commit that introduced the bug. The loop script must exit 0 (good) or non-zero (bad).

9. **Differential loop** — run old version and new version against the same input, diff their outputs. Any divergence is a candidate for the bug.

10. **HITL bash script (last resort)** — if a human must click something, structure it exactly like the other loops: script prints "now do X", waits for Enter, then asserts the observable outcome. Still gives you a repeatable record of steps.

#### Treat the Loop as a Product — Iterate on It

After getting a loop that reproduces, ask:

- **Can I make it faster?** A 2-second loop enables 10x more hypothesis tests per hour than a 20-second loop.
- **Can I make the signal sharper?** Asserting on the exact symptom (`assert response.status == 401`) is better than "it didn't crash". Vague signals mask partial fixes.
- **Can I make it more deterministic?** Pin time (`freezegun`, `vi.setSystemTime`), seed the RNG, isolate the filesystem (`tmpdir`), freeze network calls (`msw`, `httpretty`). A deterministic 2-second loop beats a flaky 30-second loop every time.

#### Non-Deterministic Bugs

If the bug doesn't reproduce every run, **the goal is not a clean repro — the goal is to raise the reproduction rate**.

- Loop 100x: `for i in $(seq 100); do ./loop_script; done`
- Parallelize: `xargs -P 8 -I{} ./loop_script <<< "$(seq 100)"`
- Add stress: increase load, add concurrent workers, reduce sleep intervals
- Inject sleeps at suspected race points to widen the window
- Track reproduction rate: "1 in 100" → after adding stress → "15 in 100" is signal

Once you can reliably trigger it (even 1 in 10), the loop is usable.

#### When You Genuinely Cannot Build a Loop

**Stop. Say so explicitly.** Do not move to hypotheses.

State what you attempted:
```
Attempted loops:
- Failing test: blocked — cannot import the module in isolation due to [reason]
- Curl script: blocked — bug only appears under authenticated session with specific account state
- Replay trace: blocked — no HAR or log dump available
```

Then ask the user for one of:
- **(a) Access to the environment** where the bug reproduces
- **(b) A captured artifact** — HAR export, full log dump, screen recording with timestamps, database snapshot
- **(c) Permission to instrument production temporarily** — add structured logging, feature-flag a debug mode, enable verbose tracing for a single user

**Do not proceed to Phase 1 without a loop unless the user explicitly accepts the risk.**

---

### Phase 1: Root Cause Investigation

**BEFORE attempting ANY fix:**

1. **Read Error Messages Carefully**
   - Don't skip past errors or warnings
   - They often contain the exact solution
   - Read stack traces completely
   - Note line numbers, file paths, error codes

2. **Reproduce Consistently**
   - Can you trigger it reliably via your loop?
   - What are the exact steps?
   - Does it happen every time?
   - If not reproducible → raise reproduction rate (see Phase 0), don't guess

3. **Check Recent Changes**
   - What changed that could cause this?
   - Git diff, recent commits
   - New dependencies, config changes
   - Environmental differences

4. **Gather Evidence in Multi-Component Systems**

   **WHEN system has multiple components (CI → build → signing, API → service → database):**

   **BEFORE proposing fixes, add diagnostic instrumentation:**
   ```
   For EACH component boundary:
     - Log what data enters component
     - Log what data exits component
     - Verify environment/config propagation
     - Check state at each layer

   Run once to gather evidence showing WHERE it breaks
   THEN analyze evidence to identify failing component
   THEN investigate that specific component
   ```

   **Example (multi-layer system):**
   ```bash
   # Layer 1: Workflow
   echo "=== Secrets available in workflow: ==="
   echo "IDENTITY: ${IDENTITY:+SET}${IDENTITY:-UNSET}"

   # Layer 2: Build script
   echo "=== Env vars in build script: ==="
   env | grep IDENTITY || echo "IDENTITY not in environment"

   # Layer 3: Signing script
   echo "=== Keychain state: ==="
   security list-keychains
   security find-identity -v

   # Layer 4: Actual signing
   codesign --sign "$IDENTITY" --verbose=4 "$APP"
   ```

   **This reveals:** Which layer fails (secrets → workflow ✓, workflow → build ✗)

5. **Trace Data Flow**

   **WHEN error is deep in call stack:**

   See `root-cause-tracing.md` in this directory for the complete backward tracing technique.

   **Quick version:**
   - Where does bad value originate?
   - What called this with bad value?
   - Keep tracing up until you find the source
   - Fix at source, not at symptom

---

### Phase 2: Pattern Analysis

**Find the pattern before fixing:**

1. **Find Working Examples**
   - Locate similar working code in same codebase
   - What works that's similar to what's broken?

2. **Compare Against References**
   - If implementing pattern, read reference implementation COMPLETELY
   - Don't skim - read every line
   - Understand the pattern fully before applying

3. **Identify Differences**
   - What's different between working and broken?
   - List every difference, however small
   - Don't assume "that can't matter"

4. **Understand Dependencies**
   - What other components does this need?
   - What settings, config, environment?
   - What assumptions does it make?

---

### Phase 3: Ranked Falsifiable Hypotheses

**Before testing anything, generate 3–5 hypotheses and rank them.**

#### Requirements for each hypothesis

Every hypothesis must be falsifiable — you must be able to state a prediction:

> "If X is the cause, then changing Y will make the bug disappear / changing Z will make it worse."

If you cannot formulate the prediction, the hypothesis is intuition, not a hypothesis. Discard it or refine it until it is testable.

#### Show the ranked list to the user before testing

The user may have context that re-ranks the list instantly — saving you from testing low-probability hypotheses first. Present it as:

```
Ranked hypotheses (most → least likely):
1. [Hypothesis] — Prediction: [what changes if true]
2. [Hypothesis] — Prediction: [what changes if true]
3. [Hypothesis] — Prediction: [what changes if true]
(+ 1-2 more if applicable)
```

#### Testing protocol

- Test **one hypothesis at a time** against the loop
- Make the **smallest possible change** that discriminates
- Did loop pass → hypothesis confirmed → move to Phase 4
- Did loop fail → hypothesis rejected → test next in ranked order
- **Never stack changes** across hypothesis tests

#### When you don't know

- Say "I don't understand X"
- Don't pretend to know
- Research more, ask the user, or return to Phase 0 to improve the loop signal

---

### Phase 4: Implementation

**Fix the root cause, not the symptom:**

1. **Lock in the Failing Loop**
   - The loop from Phase 0 now serves as your regression test
   - It must be failing before you write any fix code
   - Use the `test-driven-development` skill if converting to a permanent test

2. **Implement Single Fix**
   - Address the root cause identified
   - ONE change at a time
   - No "while I'm here" improvements
   - No bundled refactoring

3. **Verify Fix**
   - Loop passes now?
   - No other tests broken?
   - Issue actually resolved?

4. **If Fix Doesn't Work**
   - STOP
   - Count: How many fixes have you tried?
   - If < 3: Return to Phase 1, re-analyze with new information
   - **If ≥ 3: STOP and question the architecture (step 5 below)**
   - DON'T attempt Fix #4 without architectural discussion

5. **If 3+ Fixes Failed: Question Architecture**

   **Pattern indicating architectural problem:**
   - Each fix reveals new shared state/coupling/problem in different place
   - Fixes require "massive refactoring" to implement
   - Each fix creates new symptoms elsewhere

   **STOP and question fundamentals:**
   - Is this pattern fundamentally sound?
   - Are we "sticking with it through sheer inertia"?
   - Should we refactor architecture vs. continue fixing symptoms?

   **Discuss with your human partner before attempting more fixes**

   This is NOT a failed hypothesis - this is a wrong architecture.

---

## Red Flags — STOP and Follow Process

If you catch yourself thinking:
- "Quick fix for now, investigate later"
- "Just try changing X and see if it works"
- "Add multiple changes, run tests"
- "Skip the test, I'll manually verify"
- "It's probably X, let me fix that"
- "I don't fully understand but this might work"
- "Pattern says X but I'll adapt it differently"
- "Here are the main problems: [lists fixes without investigation]"
- Proposing solutions before tracing data flow
- **"One more fix attempt" (when already tried 2+)**
- **Each fix reveals new problem in different place**
- **Moving to hypotheses without a loop**

**ALL of these mean: STOP. Return to Phase 0.**

**If 3+ fixes failed:** Question the architecture (see Phase 4.5)

## Your Human Partner's Signals You're Doing It Wrong

**Watch for these redirections:**
- "Is that not happening?" - You assumed without verifying
- "Will it show us...?" - You should have added evidence gathering
- "Stop guessing" - You're proposing fixes without understanding
- "Ultrathink this" - Question fundamentals, not just symptoms
- "We're stuck?" (frustrated) - Your approach isn't working

**When you see these:** STOP. Return to Phase 0.

## Common Rationalizations

| Excuse | Reality |
|--------|---------|
| "Issue is simple, don't need process" | Simple issues have root causes too. Process is fast for simple bugs. |
| "Emergency, no time for process" | Systematic debugging is FASTER than guess-and-check thrashing. |
| "Just try this first, then investigate" | First fix sets the pattern. Do it right from the start. |
| "I can't build a loop, so I'll hypothesize" | No loop = no signal. Hypotheses without a loop are guesses. |
| "I'll write test after confirming fix works" | Untested fixes don't stick. Test first proves it. |
| "Multiple fixes at once saves time" | Can't isolate what worked. Causes new bugs. |
| "Reference too long, I'll adapt the pattern" | Partial understanding guarantees bugs. Read it completely. |
| "I see the problem, let me fix it" | Seeing symptoms ≠ understanding root cause. |
| "One more fix attempt" (after 2+ failures) | 3+ failures = architectural problem. Question pattern, don't fix again. |

## Quick Reference

| Phase | Key Activities | Success Criteria |
|-------|---------------|------------------|
| **0. Feedback Loop** | Build fastest reproducible loop, iterate on speed/signal/determinism | Loop fails on demand, runs in seconds |
| **1. Root Cause** | Read errors, check changes, gather evidence, trace data flow | Understand WHAT and WHY |
| **2. Pattern** | Find working examples, compare | Identify differences |
| **3. Hypotheses** | Generate 3-5 ranked falsifiable hypotheses, show user | One confirmed hypothesis |
| **4. Implementation** | Use loop as test, fix, verify | Bug resolved, loop passes |

## When Process Reveals "No Root Cause"

If systematic investigation reveals issue is truly environmental, timing-dependent, or external:

1. You've completed the process
2. Document what you investigated
3. Implement appropriate handling (retry, timeout, error message)
4. Add monitoring/logging for future investigation

**But:** 95% of "no root cause" cases are incomplete investigation.

## Supporting Techniques

These techniques are part of systematic debugging and available in this directory:

- **`root-cause-tracing.md`** - Trace bugs backward through call stack to find original trigger
- **`defense-in-depth.md`** - Add validation at multiple layers after finding root cause
- **`condition-based-waiting.md`** - Replace arbitrary timeouts with condition polling

**Related skills:**
- **test-driven-development** - For creating failing test case (Phase 4, Step 1)
- **verification-before-completion** - Verify fix worked before claiming success

## Real-World Impact

From debugging sessions:
- Systematic approach: 15-30 minutes to fix
- Random fixes approach: 2-3 hours of thrashing
- First-time fix rate: 95% vs 40%
- New bugs introduced: Near zero vs common
