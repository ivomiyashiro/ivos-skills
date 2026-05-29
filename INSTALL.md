# Installing ivos-skills

## Claude Code

### Install (one time)

```bash
# 1. Add ivos-skills as a marketplace source
claude plugins marketplace add ivomiyashiro/ivos-skills

# 2. Install the plugin
claude plugins install ivos-skills@ivos-skills
```

Then restart Claude Code. All skills are available automatically — Claude picks them up based on context.

### Keep up to date

```bash
claude plugins update ivos-skills
```

Claude Code tracks the installed git commit SHA and pulls the latest version from the repo.

---

## OpenCode

See [.opencode/INSTALL.md](.opencode/INSTALL.md) for OpenCode installation instructions.

---

## Codex

### Install (one time)

```bash
# 1. Add ivos-skills as a marketplace source
codex plugin marketplace add https://github.com/ivomiyashiro/ivos-skills.git

# 2. Install the plugin
codex plugin add ivos-skills@ivos-skills
```

Then restart Codex. All skills are available automatically.

### Keep up to date

```bash
codex plugin marketplace upgrade ivos-skills
```

Codex tracks the configured marketplace and refreshes the git snapshot when upgraded.

---

## Antigravity CLI

### Install

```bash
agy plugin install https://github.com/ivomiyashiro/ivos-skills.git
```

Then restart `agy`. All skills are available automatically.

### Uninstall

```bash
agy plugin uninstall ivos-skills
```
