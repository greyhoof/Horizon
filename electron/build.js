import { program } from 'commander';
import { arch } from 'os';
import { build, Platform } from 'electron-builder'; // Move Platform import here
import path from 'path';
import fs from 'fs';

// ** Specify our options
//    - Required: OS
//    - Optional: format, arch, version, output
//   - Help: Display help for the command
program
  .requiredOption(
    '--os <os>',
    'Specify the target operating system (MacOS, Linux, Windows)'
  )
  .option(
    '-f, --format <formats...>',
    'Specify one or more output formats for the given OS (e.g., deb, tar.gz, AppImage)'
  )
  .option(
    '-a, --arch <arches...>',
    'Specify one or more target architectures (e.g., x64, arm64)'
  )
  .option(
    '-v, --version <version>',
    'Specify the app version (defaults to version from package.json)'
  )
  .option(
    '-o, --output <directory>',
    'Specify the output directory for build artifacts'
  )
  .helpOption('-h, --help', 'Display help for command')
  .addHelpText(
    'after',
    `
Examples:
  $ node electron/build.js --os windows --format nsis --arch x64
  $ node electron/build.js --os macos --format dmg --arch universal
  $ node electron/build.js --os linux --format AppImage --arch x64 --output ./my-builds`
  );

program.parse(process.argv);

const options = program.opts();

// ** Supported OSes, formats, and architectures
//    - MacOS: dmg, zip (x64, arm64)
//    - Linux: deb, rpm, tar.gz (x64, arm64)
//    - Windows: exe, msi, nsis (x64, ia32, arm64)
const OSes = [
  {
    name: 'macos',
    aliases: ['mac', 'osx', 'darwin'],
    formats: ['dmg', 'zip'],
    arches: ['x64', 'arm64', 'universal'],
    platformName: 'MAC' // Change to MAC (uppercase)
  },
  {
    name: 'linux',
    aliases: ['ubuntu', 'debian', 'fedora', 'centos'],
    formats: ['deb', 'rpm', 'tar.gz', 'AppImage'],
    arches: ['x64', 'arm64'],
    platformName: 'LINUX' // Change to LINUX (uppercase)
  },
  {
    name: 'windows',
    aliases: ['win', 'win32', 'win64'],
    formats: ['exe', 'msi', 'nsis'],
    arches: ['x64', 'ia32', 'arm64'],
    platformName: 'WINDOWS' // Change to WINDOWS (uppercase)
  }
];

// &  Find the target OS based on the user input
const targetOS = OSes.find(os => {
  return (
    os.name === options.os || os.aliases.includes(options.os.toLowerCase())
  );
});

// FUNCTION: validateOS
//    - Check if the target OS is valid
//    - Print an error message and exit if the OS is invalid
function validateOS() {
  if (!targetOS) {
    console.error('Invalid OS:', options.os);
    console.error('Supported OSes:', OSes.map(os => os.name).join(', '));
    process.exit(1);
  }
}

// FUNCTION: validateFormat
//    - Check if the output formats are valid
//    - Print an error message and exit if any format is invalid
function validateFormat() {
  if (options.format) {
    const invalidFormats = options.format.filter(format => {
      return !targetOS.formats.includes(format);
    });

    if (invalidFormats.length) {
      console.error('Invalid formats:', invalidFormats.join(', '));
      console.error('Supported formats:', targetOS.formats.join(', '));
      process.exit(1);
    }
  }
}

// FUNCTION: validateArch
//    - Check if the target architectures are valid
//    - Print an error message and exit if any architecture is invalid
function validateArch() {
  if (options.arch) {
    const invalidArches = options.arch.filter(arch => {
      return !targetOS.arches.includes(arch);
    });

    if (invalidArches.length) {
      console.error('Invalid architectures:', invalidArches.join(', '));
      console.error('Supported architectures:', targetOS.arches.join(', '));
      process.exit(1);
    }
  }
}

function isvalidoptions() {
  // Check if OS is specified (already required by Commander)
  if (!options.os) {
    return false;
  }

  // Set default formats if not specified
  if (!options.format || options.format.length === 0) {
    // Use the first supported format as default
    options.format = [targetOS.formats[0]];
    console.log(`No format specified, using default: ${options.format}`);
  }

  // Set default architectures if not specified
  if (!options.arch || options.arch.length === 0) {
    // Use the current system architecture if supported, otherwise the first supported one
    const systemArch = arch();
    const mappedArch =
      systemArch === 'x64'
        ? 'x64'
        : systemArch === 'arm64'
          ? 'arm64'
          : systemArch === 'ia32'
            ? 'ia32'
            : targetOS.arches[0];

    options.arch = targetOS.arches.includes(mappedArch)
      ? [mappedArch]
      : [targetOS.arches[0]];

    console.log(`No architecture specified, using default: ${options.arch}`);
  }

  return true;
}

// FUNCTION: processOptions
//    - Validate the target OS, formats, and architectures
//    - Print the target OS, formats, and architectures
function processOptions() {
  validateOS();
  validateFormat();
  validateArch();

  console.log('Target OS:', options.os);
  console.log('Output Formats:', options.format);
  console.log('Architectures:', options.arch);
}

// FUNCTION: getAppVersion
//    - Get the app version from package.json or command line option
async function getAppVersion() {
  if (options.version) {
    return options.version;
  }

  try {
    const packageJsonPath = path.resolve(process.cwd(), 'package.json');
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    return packageJson.version;
  } catch (error) {
    console.error('Failed to read version from package.json:', error);
    process.exit(1);
  }
}

// FUNCTION: getOutputDirectory
//    - Get the output directory from command line option or use default
function getOutputDirectory(appVersion) {
  if (options.output) {
    return path.resolve(process.cwd(), options.output);
  }

  return path.resolve(process.cwd(), 'dist', `v${appVersion}`);
}

// FUNCTION: configureBuild
//    - Configure the electron-builder build options
async function configureBuild(appVersion) {
  const outputDir = getOutputDirectory(appVersion);

  // Make sure the output directory exists
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  console.log(`Building v${appVersion} for ${targetOS.name}`);
  console.log(`Output directory: ${outputDir}`);

  // Create proper target configuration
  const targetConfig = {};

  // Use platform-specific target configuration
  if (targetOS.name === 'linux') {
    targetConfig.linux = {
      target: options.format.map(fmt => ({
        target: fmt,
        arch: options.arch
      }))
    };
  } else if (targetOS.name === 'macos') {
    targetConfig.mac = {
      target: options.format.map(fmt => ({
        target: fmt,
        arch: options.arch
      }))
    };
  } else if (targetOS.name === 'windows') {
    targetConfig.win = {
      target: options.format.map(fmt => ({
        target: fmt,
        arch: options.arch
      }))
    };
  }

  return {
    config: {
      appId: 'com.fchat.horizon',
      productName: 'F-Chat Horizon',
      artifactName: '${productName}-${version}-${os}-${arch}.${ext}',
      directories: {
        output: outputDir
      },
      files: ['dist/**/*', 'node_modules/**/*', 'package.json'],
      // Platform-specific configurations + target configurations
      ...getPlatformConfig(),
      ...targetConfig
    }
  };
}

// FUNCTION: getPlatformConfig
//    - Get platform-specific configuration for electron-builder
function getPlatformConfig() {
  switch (targetOS.name) {
    case 'macos':
      return {
        mac: {
          category: 'public.app-category.social-networking',
          hardenedRuntime: true,
          gatekeeperAssess: false,
          entitlements: 'build/entitlements.mac.plist',
          entitlementsInherit: 'build/entitlements.mac.plist',
          target: options.format
        },
        dmg: {
          contents: [
            {
              x: 130,
              y: 220
            },
            {
              x: 410,
              y: 220,
              type: 'link',
              path: '/Applications'
            }
          ]
        }
      };
    case 'linux':
      return {
        linux: {
          target: options.format,
          category: 'Network;Chat'
        }
      };
    case 'windows':
      return {
        win: {
          target: options.format,
          icon: 'build/icon.ico'
        },
        nsis: {
          oneClick: false,
          allowToChangeInstallationDirectory: true,
          createDesktopShortcut: true,
          createStartMenuShortcut: true
        }
      };
    default:
      return {};
  }
}

// FUNCTION: buildElectronApp
//    - Build the Electron app using electron-builder
async function buildElectronApp() {
  try {
    processOptions();

    const appVersion = await getAppVersion();
    const buildConfig = await configureBuild(appVersion);

    console.log('Starting build process...');
    const result = await build(buildConfig);

    console.log('Build completed successfully!');
    console.log('Artifacts:', result);

    return result;
  } catch (error) {
    console.error('Build failed:', error);
    process.exit(1);
  }
}

// Execute the build process
buildElectronApp();
