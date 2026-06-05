---
name: systematic-debugging
description: Use when encountering any bug, test failure, or unexpected behavior, before proposing fixes
---

# Systematic Debugging

## Iron Law

No fixes without a feedback loop first.

A loop must reproduce the symptom, give a clear pass/fail signal, and run fast enough to iterate. Without a loop, every fix is guessing.

Read `CONTEXT.md` if it exists and use project vocabulary.

## Process

1. **Build loop:** failing test, curl/CLI script, browser script, replay trace, harness, fuzz/bisect/differential loop, or HITL script as last resort.
2. **Sharpen loop:** make it faster, deterministic, and assert the exact symptom.
3. **Investigate root cause:** read full errors, check recent changes, trace data flow backward, instrument boundaries in multi-component systems.
4. **Compare patterns:** find working examples, read references completely, list differences.
5. **Rank hypotheses:** 3-5 falsifiable predictions, most likely first. Test one change at a time.
6. **Fix root cause:** use the loop as regression test, make one fix, verify, then check broader tests.

If no loop is possible, stop and ask for access, captured artifacts, or permission to instrument. Proceed without a loop only with explicit user acceptance of risk.

## Failed Fix Limit

After 3 failed fixes, stop. That usually signals architectural mismatch, hidden coupling, or wrong assumptions. Discuss fundamentals before attempting another fix.

## Red Flags

- "quick fix first"
- "just try X"
- proposing fixes before evidence
- multiple fixes before rerunning loop
- manual verification instead of loop
- not understanding the error/stack
- "one more fix" after repeated failures

Return to the loop when any red flag appears.

## Useful References

- `root-cause-tracing.md` - trace bad values backward through callers
- `defense-in-depth.md` - add layered validation after root cause
- `condition-based-waiting.md` - replace sleeps/timeouts with condition polling
- `find-polluter.sh` - isolate test pollution
- `test-driven-development` - permanent regression tests
- `verification-before-completion` - evidence before success claims
