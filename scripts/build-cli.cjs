#!/usr/bin/env node

const fs = require('node:fs');
const path = require('node:path');

const projectRoot = path.resolve(__dirname, '..');
const distDir = path.join(projectRoot, 'dist');
const cliOutput = path.join(distDir, 'cli.js');

fs.mkdirSync(distDir, { recursive: true });

const pkg = JSON.parse(fs.readFileSync(path.join(projectRoot, 'package.json'), 'utf8'));
const version = typeof pkg.version === 'string' ? pkg.version : '0.0.0-dev';
const packageName = typeof pkg.name === 'string' ? pkg.name : 'claude-code-source';

const cliShim = `#!/usr/bin/env bun
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const sourceCli = path.resolve(__dirname, '..', 'src', 'entrypoints', 'cli.tsx');

if (!existsSync(sourceCli)) {
  console.error('❌ Missing source entrypoint: ' + sourceCli);
  process.exit(1);
}

const macroDefaults = {
  VERSION: ${JSON.stringify(version)},
  PACKAGE_URL: ${JSON.stringify(packageName)}
};

globalThis.MACRO = new Proxy(macroDefaults, {
  get(target, property) {
    return property in target ? target[property] : undefined;
  }
});

await import(pathToFileURL(sourceCli).href);
`;

fs.writeFileSync(cliOutput, cliShim, 'utf8');
fs.chmodSync(cliOutput, 0o755);

console.log(`✅ Built ${path.relative(projectRoot, cliOutput)}`);
