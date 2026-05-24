# Instructions for Gemini / Antigravity Agents

This repository is a collection of skills (`ivos-skills`) for various AI agents (Claude Code, Antigravity/Gemini CLI, OpenCode, etc.).

## ⚠️ CRITICAL: VERSION BUMPING

When you (an AI Agent) create, modify, or delete a skill in this repository, **you must ensure the plugin version is bumped** so that clients can download the latest updates.

The repository uses a `pre-commit` hook that automatically increments the version across all required manifest files:
- `plugin.json`
- `package.json`
- `.claude-plugin/plugin.json`
- `.claude-plugin/marketplace.json`

**Your Workflow:**
1. Make your changes to the `skills/` directory.
2. Run `git add .` and `git commit -m "Your commit message"`. 
   - *Note: The `pre-commit` hook will automatically run `node scripts/bump-version.js` and add the updated JSON files to your commit.*
3. A `post-commit` hook will automatically create a new Git Tag (e.g., `v1.1.4`) pointing to your commit.
4. Run `git push`. (The repository is configured with `push.followTags = true`, so the tag will be pushed automatically).

Failure to commit and push will result in the clients not seeing the updates.
