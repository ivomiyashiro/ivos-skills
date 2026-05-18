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

OpenCode installs ivos-skills through a git-backed package spec. To update to the latest version, restart OpenCode or reinstall the plugin.

To pin a specific version:

```json
{
  "plugin": ["ivos-skills@git+https://github.com/ivomiyashiro/ivos-skills.git#v1.0.0"]
}
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
