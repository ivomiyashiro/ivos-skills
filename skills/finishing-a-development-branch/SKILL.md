---
name: finishing-a-development-branch
description: Use when implementation is complete, all tests pass, and you need to decide how to integrate the work - guides completion of development work by presenting structured options for merge, PR, or cleanup
---

# Finishing A Development Branch

Announce: "I'm using the finishing-a-development-branch skill to complete this work."

## Flow

1. Invoke `verification-before-completion`; run full project verification fresh.
   - TypeScript: include typecheck if configured.
   - Flutter/Dart: include `flutter analyze`/`dart analyze`.
   - If verification fails, stop and report failures.
2. Detect environment:
   ```bash
   GIT_DIR=$(cd "$(git rev-parse --git-dir)" && pwd -P)
   GIT_COMMON=$(cd "$(git rev-parse --git-common-dir)" && pwd -P)
   ```
3. Determine base branch (`main`/`master` merge-base, or ask if unclear).
4. Present menu, then execute exact choice.

## Menus

Normal repo or named worktree:
```text
Implementation complete. What would you like to do?
1. Merge back to <base-branch> locally
2. Push and create a Pull Request
3. Keep the branch as-is
4. Discard this work
```

Detached/external workspace:
```text
Implementation complete. You're on a detached HEAD.
1. Push as new branch and create a Pull Request
2. Keep as-is
3. Discard this work
```

## Safety Rules

- Verify before offering options.
- Merge first, verify merged result, then cleanup.
- Never clean up worktree for PR/keep options.
- Discard requires typed `discard` confirmation and commit list.
- Only remove worktrees under `.worktrees/`, `worktrees/`, or `~/.config/agent/worktrees/`.
- Run `git worktree remove` from the main repo root, then `git worktree prune`.
- Never force-push or delete remote branches without explicit request.
