#!/usr/bin/env node

const { spawnSync } = require('node:child_process');

const MIN_BUN_VERSION = '1.2.0';

function parseSemver(value) {
  const clean = String(value || '').trim().replace(/^v/i, '');
  const match = clean.match(/^(\d+)\.(\d+)\.(\d+)/);

  if (!match) {
    return null;
  }

  return {
    major: Number(match[1]),
    minor: Number(match[2]),
    patch: Number(match[3]),
  };
}

function isVersionGte(current, minimum) {
  if (current.major !== minimum.major) {
    return current.major > minimum.major;
  }

  if (current.minor !== minimum.minor) {
    return current.minor > minimum.minor;
  }

  return current.patch >= minimum.patch;
}

function getBunVersion() {
  const result = spawnSync('bun', ['--version'], { stdio: 'pipe', encoding: 'utf8' });

  if (result.error || result.status !== 0) {
    return null;
  }

  return (result.stdout || '').trim();
}

function ensureBunVersion(minVersion = MIN_BUN_VERSION) {
  const bunVersion = getBunVersion();

  if (!bunVersion) {
    console.error('❌ Bun is required (build/runtime) for this package.');
    console.error('❌ Bun es obligatorio (build/runtime) para este paquete.');
    console.error('Install/Instala Bun: https://bun.sh');
    process.exit(1);
  }

  const parsedCurrent = parseSemver(bunVersion);
  const parsedMinimum = parseSemver(minVersion);

  if (!parsedCurrent || !parsedMinimum || !isVersionGte(parsedCurrent, parsedMinimum)) {
    console.error(`❌ Bun >= ${minVersion} is required. Current: ${bunVersion || 'unknown'}`);
    console.error(`❌ Se requiere Bun >= ${minVersion}. Actual: ${bunVersion || 'desconocida'}`);
    console.error('Update/Actualiza Bun: https://bun.sh');
    process.exit(1);
  }

  return bunVersion;
}

module.exports = {
  MIN_BUN_VERSION,
  ensureBunVersion,
};

if (require.main === module) {
  const version = ensureBunVersion();
  console.log(`✅ Bun detected: ${version}`);
}
