// npm run build — `next build` that also works on old cPanel / CloudLinux servers.
//
// Next.js 16's fast builder (Turbopack) needs glibc 2.29+; the native image library (sharp) 2.26+.
// On older servers (CentOS / CloudLinux 7–8) this script:
//   1. builds with webpack (`next build --webpack`, using Next's WebAssembly compiler),
//   2. runs Node with --disable-wasm-trap-handler: WebAssembly otherwise reserves ~10 GB of address space, more than
//      CloudLinux allows per process ("JavaScript heap out of memory" at ~250 MB of heap),
//   3. builds with low resources: one process at a time, webpack memory optimizations, a 1 GB heap (NEXT_LOW_RESOURCES=1,
//      read by next.config.mjs),
//   4. if sharp can't run, installs its WebAssembly build (@img/sharp-wasm32); if the live site still couldn't use it,
//      image optimization is switched off (marker file .image-unoptimized, read by next.config.mjs) and the script
//      says how to turn it on.
// On a modern machine it is just `next build`.
//
// Options: --webpack (force webpack) · --low-memory (low-resource build anywhere) · env NEXT_BUILD_WEBPACK=1
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(import.meta.url);
const args = process.argv.slice(2);

// glibc of this machine ('2.28'), or null on Windows / macOS / musl
const glibc = process.report?.getReport?.().header?.glibcVersionRuntime || null;
const older = (version, than) => {
  const [a, b] = version.split('.').map(Number);
  const [c, d] = than.split('.').map(Number);
  return a < c || (a === c && b < d);
};
const oldLinux = Boolean(glibc && older(glibc, '2.29'));
const lowResources = oldLinux || args.includes('--low-memory');

const WASM_FLAG = '--disable-wasm-trap-handler';
const userNodeOptions = process.env.NODE_OPTIONS || '';
const withOption = (options, flag) => (options.includes(flag.split('=')[0]) ? options : `${options} ${flag}`.trim());

// Where packages are installed: the app's node_modules (on cPanel a link into the Node.js virtual environment),
// NODE_PATH, or the virtual environment itself (npm_config_prefix/lib/node_modules)
const SEARCH_PATHS = [
  root,
  ...(process.env.NODE_PATH || '').split(path.delimiter).filter(Boolean),
  ...(process.env.npm_config_prefix ? [path.join(process.env.npm_config_prefix, 'lib', 'node_modules')] : []),
];
const findPackage = (name) => {
  try {
    return path.dirname(require.resolve(`${name}/package.json`, { paths: SEARCH_PATHS }));
  } catch {
    return null;
  }
};

const nextDir = findPackage('next');
if (!nextDir) {
  console.error(
    '\n✖ Next.js is not installed for this app (no node_modules/next).\n' +
      '  cPanel → Setup Node.js App → your app → "Run NPM Install" (wait until it finishes), then run "build" again.\n' +
      "  Tip: don't delete the \"node_modules\" link in the app folder — cPanel creates it.\n"
  );
  process.exit(1);
}
const nextVersion = require(path.join(nextDir, 'package.json')).version;

const run = (cmd, cmdArgs, env = {}) => spawnSync(cmd, cmdArgs, { cwd: root, stdio: 'inherit', env: { ...process.env, ...env } }).status ?? 1;
// Can sharp load and process an image with these Node options?
const sharpWorks = (nodeOptions) =>
  spawnSync(
    process.execPath,
    ['-e', "require('sharp')({create:{width:2,height:2,channels:3,background:'#fff'}}).webp().toBuffer().then(()=>process.exit(0),()=>process.exit(1))"],
    { cwd: root, stdio: 'ignore', env: { ...process.env, NODE_OPTIONS: nodeOptions } }
  ).status === 0;

// ---------- photos: sharp (native, else WebAssembly) ----------
const marker = path.join(root, '.image-unoptimized');
fs.rmSync(marker, { force: true });

if (!sharpWorks(userNodeOptions)) {
  let version = '';
  try {
    version = require(path.join(findPackage('sharp'), 'package.json')).version;
  } catch {
    /* sharp not installed at all */
  }
  const npmCli = process.env.npm_execpath; // set when run through `npm run build`
  if (version && npmCli && !sharpWorks(withOption(userNodeOptions, WASM_FLAG))) {
    console.log(`\n• The native image library can't run here${glibc ? ` (glibc ${glibc})` : ''} — installing its WebAssembly build…\n`);
    run(process.execPath, [npmCli, 'install', '--no-save', '--no-audit', '--no-fund', '--cpu=wasm32', `@img/sharp-wasm32@${version}`]);
  }
  if (sharpWorks(userNodeOptions)) {
    console.log('• sharp (WebAssembly) is ready — photos will be resized and converted to WebP.\n');
  } else {
    fs.writeFileSync(marker, 'sharp cannot run for the live site on this server, so next/image serves photos without optimization.');
    if (sharpWorks(withOption(userNodeOptions, WASM_FLAG))) {
      console.log(
        '• Photos are shown as uploaded for now. To let the site resize photos too, add this environment variable in\n' +
          `  Setup Node.js App → Environment variables:   NODE_OPTIONS = ${WASM_FLAG}\n` +
          '  then Save, run "build" again and Restart.\n'
      );
    } else {
      console.log('• sharp is not available on this server — photos are shown as uploaded (no resizing).\n');
    }
  }
}

// ---------- build ----------
const useWebpack = args.includes('--webpack') || process.env.NEXT_BUILD_WEBPACK === '1' || oldLinux;
if (oldLinux) console.log(`• glibc ${glibc} is older than 2.29 — building with webpack and low resources (takes a few minutes).\n`);

let nodeOptions = userNodeOptions;
if (oldLinux) nodeOptions = withOption(nodeOptions, WASM_FLAG);
// Small heap + small young generation: CloudLinux counts every byte the process maps against the account limit
if (lowResources) nodeOptions = withOption(withOption(nodeOptions, '--max-old-space-size=1024'), '--max-semi-space-size=8');

const env = {
  NODE_ENV: 'production', // cPanel sometimes sets another value — Next warns about it
  NEXT_TELEMETRY_DISABLED: '1',
  NODE_OPTIONS: nodeOptions,
  ...(lowResources && { NEXT_LOW_RESOURCES: '1' }),
};
console.log(`• Next.js ${nextVersion}\n`);
const nextBin = path.join(nextDir, 'dist', 'bin', 'next');
const status = run(process.execPath, [nextBin, 'build', ...(useWebpack ? ['--webpack'] : [])], env);
if (status === 0) {
  // server.cjs only starts a build made by the Next.js version that is installed
  fs.writeFileSync(path.join(root, '.next', 'NEXT_VERSION'), nextVersion);
  console.log('\n✓ Build finished. On cPanel: click "Restart" in Setup Node.js App.');
}
else if (lowResources) {
  console.log('\n✖ Build failed. If it ran out of memory: ask your host to raise the LVE memory limit to 2 GB+ for the build, or build on another Linux machine (see DEPLOY_CPANEL.md).');
}
process.exit(status);
