# Installing ivos-skills for OpenCode

## Prerequisites

- [OpenCode.ai](https://opencode.ai) installed

## Installation (Recommended: pinned tag)

**Always use a pinned tag** so OpenCode can detect updates when you change the version:

```json
{
  "plugin": ["ivos-skills@git+https://github.com/ivomiyashiro/ivos-skills.git#v1.1.0"]
}
```

Add this to your `opencode.json` (global at `~/.config/opencode/opencode.json` or project-level at `./.opencode.json`), then restart OpenCode.

The plugin installs through OpenCode's plugin manager and registers all skills automatically.

Verify by asking: "List my available skills" or use the `skill` tool.

> **Why a pinned tag?** OpenCode caches git-backed plugins. Without a tag, it may stick to the first version it downloaded and never pick up new updates. Changing the tag (e.g. `#v1.1.0` → `#v1.2.0`) tells OpenCode explicitly that there is a new version to fetch.

## Updating to a new version

When a new release is available, update the tag in your `opencode.json` and restart OpenCode:

```json
{
  "plugin": ["ivos-skills@git+https://github.com/ivomiyashiro/ivos-skills.git#v1.2.0"]
}
```

### Force reinstall (if changing the tag doesn't update)

If OpenCode has cached an old version:

```bash
# Remove the cached plugin
rm -rf ~/.config/opencode/node_modules/ivos-skills

# Or on Windows PowerShell:
Remove-Item -Recurse -Force "$env:USERPROFILE\.config\opencode\node_modules\ivos-skills"
```

Then restart OpenCode.

### Update via npm

```bash
# Update the git-backed package
npm install ivos-skills@git+https://github.com/ivomiyashiro/ivos-skills.git --prefix ~/.config/opencode
```

## Installing individual skills

If you prefer to install only specific skills instead of the entire plugin, you can use the Skills CLI:

```bash
# Install a specific skill globally
npx skills add ivomiyashiro/ivos-skills --skill nombre-skill -g -y
```

## Troubleshooting

### Plugin not loading

1. Check that the plugin line is correct in your `opencode.json`
2. Make sure you're running a recent version of OpenCode
3. Try restarting OpenCode

### Skills not found

1. Use the `skill` tool to list discovered skills
2. Check that the plugin is loading correctly

### Windows install issues

Some Windows OpenCode builds may have issues with git-backed plugin specs. If OpenCode cannot install the plugin, try installing with system npm and pointing OpenCode at the local package:

```powershell
npm install ivos-skills@git+https://github.com/ivomiyashiro/ivos-skills.git --prefix "$HOME\.config\opencode"
```

Then use the installed package path in `opencode.json`:

```json
{
  "plugin": ["~/.config/opencode/node_modules/ivos-skills"]
}
```
