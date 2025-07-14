/**
 * NOTE: Hey! Welcome to Rose's (shitfest) build script for the Horizon Project.
 */

import { program } from 'commander';
import { arch as systemArch } from 'os';
import { build } from 'electron-builder';
import { execSync } from 'child_process';
import path from 'path';
import fs from 'fs';

const COLORS = {
  reset: '\u001b[0m',
  red: '\u001b[31m',
  yellow: '\u001b[33m',
  cyan: '\u001b[36m'
};

/**
 * defaults: Operating system build configurations
 */
const OS_CONFIGS = {
  macos: {
    aliases: ['mac', 'osx', 'darwin'],
    formats: ['dmg', 'zip'],
    arches: ['x64', 'arm64', 'universal']
  },
  linux: {
    aliases: ['ubuntu', 'debian', 'fedora', 'centos'],
    formats: ['deb', 'rpm', 'tar.gz', 'AppImage'],
    arches: ['x64', 'arm64']
  },
  windows: {
    aliases: ['win', 'win32', 'win64'],
    formats: ['exe', 'msi', 'nsis'],
    arches: ['x64', 'ia32', 'arm64']
  }
};

program
  .requiredOption('--os <os>', 'Target OS (macos, linux, windows)')
  .option('-f, --format <formats...>', 'Output formats')
  .option('-a, --arch <arches...>', 'Target architectures')
  .option('-v, --version <version>', 'App version')
  .option('-o, --output <dir>', 'Output directory')
  .option('--docker', 'Force Docker builds')
  .option('--no-docker', 'Disable Docker builds')
  .parse(process.argv);

const opts = program.opts();

// $ Find target OS configuration from user input
const targetKey = Object.keys(OS_CONFIGS).find(
  key =>
    key === opts.os.toLowerCase() ||
    OS_CONFIGS[key].aliases.includes(opts.os.toLowerCase())
);

// ! Exit if invalid OS specified
if (!targetKey) {
  console.error(`${COLORS.red}Invalid OS: ${opts.os}${COLORS.reset}`);
  process.exit(1);
}

const { formats: defaultFormats, arches: defaultArches } =
  OS_CONFIGS[targetKey];

// * Set defaults if not specified
opts.format = opts.format?.length ? opts.format : [defaultFormats[0]];
opts.arch = opts.arch?.length
  ? opts.arch
  : [defaultArches.includes(systemArch()) ? systemArch() : defaultArches[0]];

// * Validate user options
const invalidFormats = opts.format.filter(f => !defaultFormats.includes(f));
const invalidArches = opts.arch.filter(a => !defaultArches.includes(a));
if (invalidFormats.length || invalidArches.length) {
  console.error(
    `${COLORS.red}Invalid options for ${targetKey}:${COLORS.reset}`
  );
  invalidFormats.length &&
    console.error(`  Formats: ${invalidFormats.join(', ')}`);
  invalidArches.length &&
    console.error(`  Architectures: ${invalidArches.join(', ')}`);
  process.exit(1);
}

console.log(
  `${COLORS.cyan}Building for ${targetKey} | formats: ${opts.format.join(', ')} | arches: ${opts.arch.join(', ')}${COLORS.reset}`
);

// $ Check if Docker is available
function isDockerAvailable() {
  try {
    execSync('docker info', { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

// $ Determine whether to use Docker for builds
// ! macOS builds cannot use Docker
const useDocker = () => {
  if (opts.docker === false || targetKey === 'macos') return false;
  if (opts.docker) {
    if (!isDockerAvailable()) {
      console.error(
        `${COLORS.red}Docker requested but not available${COLORS.reset}`
      );
      process.exit(1);
    }
    return true;
  }
  return isDockerAvailable();
};

// $ Get appropriate Docker image for target OS
function getDockerImage() {
  return targetKey === 'linux'
    ? 'electronuserland/builder:20'
    : 'electronuserland/builder:wine';
}

// $ Execute Docker-based build
function runDocker() {
  const image = getDockerImage();
  const project = path.basename(process.cwd());

  // * Filter relevant environment variables
  const envVars = Object.keys(process.env)
    .filter(key =>
      /^(DEBUG|NODE_|ELECTRON_|YARN_|NPM_|CI|TRAVIS|GITHUB_)/i.test(key)
    )
    .map(key => `-e ${key}="${process.env[key]}"`)
    .join(' ');

  const formats = opts.format.join(' ');
  const archFlags = opts.arch.map(a => `--${a}`).join(' ');
  const outputDir = opts.output || 'dist';
  const outputFlag = `-o ${outputDir}`;

  // ^ Volume mounts preserve node_modules and electron caches
  const dockerCmd = `docker run --rm -ti \
  --user ${process.getuid()}:${process.getgid()} \
  ${envVars} \
  --env ELECTRON_CACHE="/tmp/.cache/electron" \
  --env ELECTRON_BUILDER_CACHE="/tmp/.cache/electron-builder" \
  -v ${process.cwd()}:/project \
  -v ${project}-node-modules:/project/node_modules \
  -v ~/.cache/electron:/tmp/.cache/electron \
  -v ~/.cache/electron-builder:/tmp/.cache/electron-builder \
  ${image} \
  /bin/bash -c "cd /project && ./node_modules/.bin/electron-builder --${targetKey} ${formats} ${archFlags} ${outputFlag}"`;

  console.log('Running Docker build...');
  execSync(dockerCmd, { stdio: 'inherit' });
}

(async () => {
  // * Clean previous build artifacts
  fs.rmSync(path.join(process.cwd(), 'dist'), { recursive: true, force: true });

  if (useDocker()) {
    return runDocker();
  }

  const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  const version = opts.version || pkg.version;
  const outDir = path.resolve(opts.output || `dist`);
  fs.mkdirSync(outDir, { recursive: true });

  // defaults: Electron Builder configuration
  const config = {
    appId: 'com.fchat.horizon',
    productName: 'F-Chat Horizon',
    artifactName: '${productName}-${version}-${os}-${arch}.${ext}',
    directories: { output: outDir },
    files: ['dist/**/*', 'node_modules/**/*', 'package.json'],
    [targetKey]: { target: opts.format }
  };

  console.log('Starting native build...');
  await build({ config });
  console.log('Build completed successfully!');
})();
