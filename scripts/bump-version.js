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

function bumpVersion(filePath) {
  if (!fs.existsSync(filePath)) return null;
  const content = fs.readFileSync(filePath, 'utf8');
  const json = JSON.parse(content);
  if (!json.version) return null;
  
  const parts = json.version.split('.');
  const patch = parseInt(parts[2], 10) + 1;
  json.version = `${parts[0]}.${parts[1]}.${patch}`;
  
  fs.writeFileSync(filePath, JSON.stringify(json, null, 2) + '\n');
  console.log(`Bumped version in ${path.basename(filePath)} to ${json.version}`);
  return json.version;
}

bumpVersion(pluginPath);
bumpVersion(packagePath);
bumpVersion(claudePluginPath);
bumpVersion(claudeMarketplacePath);
bumpVersion(codexPluginPath);
