#!/usr/bin/env node

const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const projectRoot = path.resolve(__dirname, '..');
const distDir = path.join(projectRoot, 'dist');
const srcDir = path.join(projectRoot, 'src');
const distSrcDir = path.join(distDir, 'src');
const cliEntry = path.join(projectRoot, 'src', 'entrypoints', 'cli.tsx');
const cliWrapperOutput = path.join(distDir, 'cli.js');
const tsconfigPath = path.join(projectRoot, 'tsconfig.json');
const transpileExtensions = new Set(['.ts', '.tsx', '.js', '.jsx', '.mts', '.cts', '.mjs', '.cjs']);

if (!fs.existsSync(cliEntry)) {
  throw new Error(`Missing CLI entrypoint: ${cliEntry}`);
}

if (!fs.existsSync(tsconfigPath)) {
  throw new Error(`Missing tsconfig for src/* alias resolution: ${tsconfigPath}`);
}

if (!fs.existsSync(srcDir)) {
  throw new Error(`Missing source directory: ${srcDir}`);
}

fs.rmSync(distDir, { recursive: true, force: true });

fs.mkdirSync(distDir, { recursive: true });

function collectTranspilableFiles(currentDir, output = []) {
  const entries = fs.readdirSync(currentDir, { withFileTypes: true });

  for (const entry of entries) {
    const entryPath = path.join(currentDir, entry.name);

    if (entry.isDirectory()) {
      collectTranspilableFiles(entryPath, output);
      continue;
    }

    const extension = path.extname(entry.name);
    const isDeclarationFile = entry.name.endsWith('.d.ts');
    if (isDeclarationFile || !transpileExtensions.has(extension)) {
      continue;
    }

    output.push(path.relative(projectRoot, entryPath));
  }

  return output;
}

function copyNonTranspilableFiles(sourceDirectory, outputDirectory) {
  const entries = fs.readdirSync(sourceDirectory, { withFileTypes: true });

  for (const entry of entries) {
    const sourcePath = path.join(sourceDirectory, entry.name);
    const relativePath = path.relative(srcDir, sourcePath);
    const destinationPath = path.join(outputDirectory, relativePath);

    if (entry.isDirectory()) {
      copyNonTranspilableFiles(sourcePath, outputDirectory);
      continue;
    }

    const extension = path.extname(entry.name);
    const isDeclarationFile = entry.name.endsWith('.d.ts');
    const shouldCopyAsAsset = isDeclarationFile || !transpileExtensions.has(extension);

    if (!shouldCopyAsAsset) {
      continue;
    }

    fs.mkdirSync(path.dirname(destinationPath), { recursive: true });
    fs.copyFileSync(sourcePath, destinationPath);
  }
}

function toRuntimeOutputPath(sourceFilePath) {
  const relativeFromSrc = path.relative(srcDir, sourceFilePath);
  const outputRelativePath = relativeFromSrc.replace(/\.[^.]+$/, '.js');
  return path.join(distSrcDir, outputRelativePath);
}

function transpileFile(sourceFilePath) {
  const outputPath = toRuntimeOutputPath(sourceFilePath);
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });

  const buildResult = spawnSync(
    'bun',
    [
      'build',
      sourceFilePath,
      '--outfile',
      outputPath,
      '--target',
      'bun',
      '--format',
      'esm',
      '--no-bundle',
    ],
    {
      cwd: projectRoot,
      stdio: 'pipe',
      encoding: 'utf8',
    },
  );

  if (buildResult.error) {
    throw buildResult.error;
  }

  if (buildResult.status !== 0) {
    if (buildResult.stdout) {
      process.stdout.write(buildResult.stdout);
    }
    if (buildResult.stderr) {
      process.stderr.write(buildResult.stderr);
    }
    process.exit(buildResult.status ?? 1);
  }
}

function toRelativeImport(fromFilePath, aliasedSubpath) {
  const targetPath = path.join(distSrcDir, aliasedSubpath);
  const relativePath = path.relative(path.dirname(fromFilePath), targetPath).replaceAll('\\', '/');
  return relativePath.startsWith('.') ? relativePath : `./${relativePath}`;
}

function rewriteSrcAliasImports(currentDir) {
  const entries = fs.readdirSync(currentDir, { withFileTypes: true });

  for (const entry of entries) {
    const entryPath = path.join(currentDir, entry.name);

    if (entry.isDirectory()) {
      rewriteSrcAliasImports(entryPath);
      continue;
    }

    if (path.extname(entry.name) !== '.js') {
      continue;
    }

    const fileContent = fs.readFileSync(entryPath, 'utf8');
    const rewrittenContent = fileContent
      .replace(/import\s*(['"])src\/([^'"]+)\1/g, (_, quote, subpath) => {
        return `import${quote}${toRelativeImport(entryPath, subpath)}${quote}`;
      })
      .replace(/from\s+(['"])src\/([^'"]+)\1/g, (_, quote, subpath) => {
        return `from ${quote}${toRelativeImport(entryPath, subpath)}${quote}`;
      })
      .replace(/import\(\s*(['"])src\/([^'"]+)\1\s*\)/g, (_, quote, subpath) => {
        return `import(${quote}${toRelativeImport(entryPath, subpath)}${quote})`;
      })
      .replace(/require\(\s*(['"])src\/([^'"]+)\1\s*\)/g, (_, quote, subpath) => {
        return `require(${quote}${toRelativeImport(entryPath, subpath)}${quote})`;
      });

    if (rewrittenContent !== fileContent) {
      fs.writeFileSync(entryPath, rewrittenContent, 'utf8');
    }
  }
}

const transpilableFiles = collectTranspilableFiles(srcDir);

if (transpilableFiles.length === 0) {
  throw new Error('No source files found to transpile.');
}

for (const sourceFileRelativePath of transpilableFiles) {
  const sourceFilePath = path.join(projectRoot, sourceFileRelativePath);
  transpileFile(sourceFilePath);
}

copyNonTranspilableFiles(srcDir, distSrcDir);
rewriteSrcAliasImports(distSrcDir);

const pkg = JSON.parse(fs.readFileSync(path.join(projectRoot, 'package.json'), 'utf8'));
const version = typeof pkg.version === 'string' ? pkg.version : '0.0.0-dev';
const packageName = typeof pkg.name === 'string' ? pkg.name : 'claude-code-source';
const buildTime = new Date().toISOString();

const cliWrapper = `#!/usr/bin/env bun
const macroDefaults = {
  VERSION: ${JSON.stringify(version)},
  PACKAGE_URL: ${JSON.stringify(packageName)},
  BUILD_TIME: ${JSON.stringify(buildTime)}
};

globalThis.MACRO = new Proxy(macroDefaults, {
  get(target, property) {
    return property in target ? target[property] : undefined;
  }
});

await import('./src/entrypoints/cli.js');
`;

fs.writeFileSync(cliWrapperOutput, cliWrapper, 'utf8');
fs.chmodSync(cliWrapperOutput, 0o755);

console.log(`✅ Built ${path.relative(projectRoot, distSrcDir)}`);
console.log(`✅ Built ${path.relative(projectRoot, cliWrapperOutput)}`);
