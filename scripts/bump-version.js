import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const pluginPath = path.resolve(__dirname, '../plugin.json');
const packagePath = path.resolve(__dirname, '../package.json');
const claudePluginPath = path.resolve(__dirname, '../.claude-plugin/plugin.json');
const claudeMarketplacePath = path.resolve(__dirname, '../.claude-plugin/marketplace.json');
const codexPluginPath = path.resolve(__dirname, '../.codex-plugin/plugin.json');
const codexMarketplacePluginPath = path.resolve(__dirname, '../plugins/ivos-skills/plugin.json');
const codexMarketplaceManifestPath = path.resolve(__dirname, '../plugins/ivos-skills/.codex-plugin/plugin.json');

function bumpVersion(filePath) {
  if (!fs.existsSync(filePath)) return null;
  const content = fs.readFileSync(filePath, 'utf8');
  const json = JSON.parse(content);
  const currentVersion = json.version ?? json.plugins?.[0]?.version;
  if (!currentVersion) return null;

  const parts = currentVersion.split('.');
  const patch = parseInt(parts[2], 10) + 1;
  const nextVersion = `${parts[0]}.${parts[1]}.${patch}`;

  if (json.version) {
    json.version = nextVersion;
  }
  if (Array.isArray(json.plugins)) {
    for (const plugin of json.plugins) {
      if (plugin.version) plugin.version = nextVersion;
    }
  }

  fs.writeFileSync(filePath, JSON.stringify(json, null, 2) + '\n');
  console.log(`Bumped version in ${path.basename(filePath)} to ${nextVersion}`);
  return nextVersion;
}

bumpVersion(pluginPath);
bumpVersion(packagePath);
bumpVersion(claudePluginPath);
bumpVersion(claudeMarketplacePath);
bumpVersion(codexPluginPath);
bumpVersion(codexMarketplacePluginPath);
bumpVersion(codexMarketplaceManifestPath);
