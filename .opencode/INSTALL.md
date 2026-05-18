# Installing ivos-skills for OpenCode

## Prerequisites

- [OpenCode.ai](https://opencode.ai) installed

## Installation

Add ivos-skills to the `plugin` array in your `opencode.json` (global or project-level):

```json
{
  "plugin": ["ivos-skills@git+https://github.com/ivomiyashiro/ivos-skills.git"]
}
```

Restart OpenCode. The plugin installs through OpenCode's plugin manager and registers all skills automatically.

Verify by asking: "List my available skills" or use the `skill` tool.

## Installing individual skills

If you prefer to install only specific skills instead of the entire plugin, you can use the Skills CLI:

```bash
# Install a specific skill globally
npx skills add ivomiyashiro/ivos-skills --skill nombre-skill -g -y
```

## Updating

OpenCode installs ivos-skills through a git-backed package spec. To update to the latest version:

### Option 1: Restart OpenCode (automatic)
Just restart OpenCode. It will check for updates on the git repository automatically.

### Option 2: Force reinstall (if restart doesn't pick up changes)
If OpenCode has cached an old version and restarting doesn't update:

```bash
# Remove the cached plugin
rm -rf ~/.config/opencode/node_modules/ivos-skills

# Or on Windows PowerShell:
Remove-Item -Recurse -Force "$env:USERPROFILE\.config\opencode\node_modules\ivos-skills"
```

Then restart OpenCode again.

### Option 3: Update via npm
```bash
# Update the git-backed package
npm install ivos-skills@git+https://github.com/ivomiyashiro/ivos-skills.git --prefix ~/.config/opencode
```

### Pinning a version
To stay on a specific version and avoid automatic updates:

```json
{
  "plugin": ["ivos-skills@git+https://github.com/ivomiyashiro/ivos-skills.git#v1.0.0"]
}
```

Use a git tag (e.g., `#v1.0.0`) or commit hash (e.g., `#a1b2c3d`) to pin.

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
