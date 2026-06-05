---
name: verification-before-completion
description: Use when about to claim work is complete, fixed, or passing, before committing or creating PRs - requires running verification commands and confirming output before making any success claims; evidence before assertions always
---

# Verification Before Completion

## Iron Law

No success/completion claim without fresh evidence.

If you did not run the proving command in this turn and read the output, do not say it passes, works, is fixed, or is done.

## Gate

1. Identify the command/check that proves the claim.
2. Run the full fresh command.
3. Read output and exit code.
4. Report actual evidence: command, result, failures/warnings.
5. Only then make the claim.

## Claim Map

| Claim | Evidence |
|-------|----------|
| tests pass | relevant test command, 0 failures |
| build passes | build command exit 0 |
| types clean | typecheck output, 0 errors |
| bug fixed | original symptom/regression loop passes |
| requirements met | checklist against spec/plan |
| agent completed | inspect diff and run verification |

## Red Flags

- "should", "probably", "looks good"
- satisfaction before verification
- relying on previous run or partial check
- trusting agent report
- committing, pushing, PRing, or moving on without evidence

Evidence first. Assertions second.
