// npm run build — `next build` that also works on small / old cPanel (CloudLinux) servers.
//
// Next.js 16.3+ needs glibc 2.30 for its native compiler; on older CloudLinux / CentOS servers it falls back to a
// WebAssembly compiler that reserves far more memory than shared hosting allows. Prefer `npm run build:cpanel-npm`
// (build on your computer, upload the result) — the server then never compiles. This script:
//   1. checks that the native compiler loads; if not, builds with webpack + the WebAssembly compiler and
//      --disable-wasm-trap-handler (WebAssembly otherwise reserves ~10 GB of address space),
//   2. on servers with a per-process memory cap (CloudLinux "Max address space", e.g. 4 GB) or with --low-memory,
//      builds gently: webpack, one process at a time, webpack memory optimizations, 1 GB heap
//      (NEXT_LOW_RESOURCES=1, read by next.config.js),
//   3. makes sure the image library (sharp) runs — native, else its WebAssembly build; if the live site couldn't use
//      it, image optimization is switched off (marker file .image-unoptimized, read by next.config.js),
//   4. records the Next.js version in .next/NEXT_VERSION (server.js refuses builds from another version).
// On a normal machine it is just `next build`.
//
// Options: --webpack (force webpack) · --low-memory (gentle build anywhere) · env NEXT_BUILD_WEBPACK=1
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(import.meta.url);
const args = process.argv.slice(2);

const glibc = process.report?.getReport?.().header?.glibcVersionRuntime || null; // '2.28', or null off glibc Linux

// Per-process address-space cap in bytes (CloudLinux sets one; normal machines have none)
function addressSpaceLimit() {
  try {
    const line = fs.readFileSync('/proc/self/limits', 'utf8').split('\n').find((l) => l.startsWith('Max address space'));
    const soft = line?.trim().split(/\s{2,}/)[1];
    return soft && /^\d+$/.test(soft) ? Number(soft) : null;
  } catch {
    return null; // not Linux
  }
}
const asLimit = addressSpaceLimit();
const constrained = Boolean(asLimit && asLimit <= 8 * 1024 ** 3);

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
const findPackage = (name, from = SEARCH_PATHS) => {
  try {
    return path.dirname(require.resolve(`${name}/package.json`, { paths: from }));
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
const loads = (code, nodeOptions = userNodeOptions) =>
  spawnSync(process.execPath, ['-e', code], { cwd: root, stdio: 'ignore', env: { ...process.env, NODE_OPTIONS: nodeOptions } }).status === 0;

// ---------- the compiler: native SWC for this platform? ----------
function nativeCompilerLoads() {
  if (process.platform !== 'linux') return true; // Windows / macOS: always native
  const libc = glibc ? 'gnu' : 'musl';
  const pkg = findPackage(`@next/swc-linux-${process.arch}-${libc}`, [nextDir, ...SEARCH_PATHS]);
  return Boolean(pkg) && loads(`require(${JSON.stringify(pkg)})`);
}
const nativeSwc = nativeCompilerLoads();

// ---------- photos: sharp (native, else WebAssembly) ----------
const sharpWorks = (nodeOptions) =>
  loads("require('sharp')({create:{width:2,height:2,channels:3,background:'#fff'}}).webp().toBuffer().then(()=>process.exit(0),()=>process.exit(1))", nodeOptions);
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
const lowResources = constrained || !nativeSwc || args.includes('--low-memory');
const useWebpack = lowResources || args.includes('--webpack') || process.env.NEXT_BUILD_WEBPACK === '1';

console.log(`• Next.js ${nextVersion} — ${nativeSwc ? 'native compiler' : `WebAssembly compiler (the native one can't run here${glibc ? `, glibc ${glibc}` : ''})`}`);
if (constrained) console.log(`• Memory cap of ${(asLimit / 1024 ** 3).toFixed(0)} GB per process, ${os.availableParallelism?.() ?? os.cpus().length} CPU cores — building gently (webpack, one process, 1 GB heap, 2 threads).`);
console.log('');

let nodeOptions = userNodeOptions;
if (!nativeSwc) nodeOptions = withOption(nodeOptions, WASM_FLAG);
// Small heap + small young generation + few V8 helper threads: CloudLinux counts every byte of address space the
// process reserves (heap, every thread's stack, allocator arenas) against the per-process cap
if (lowResources) {
  nodeOptions = withOption(withOption(nodeOptions, '--max-old-space-size=1024'), '--max-semi-space-size=8');
  nodeOptions = withOption(nodeOptions, '--v8-pool-size=2');
}

const env = {
  NODE_ENV: 'production', // cPanel sometimes sets another value — Next warns about it
  NEXT_TELEMETRY_DISABLED: '1',
  NODE_OPTIONS: nodeOptions,
  ...(lowResources && {
    NEXT_LOW_RESOURCES: '1',
    // Shared servers have dozens of CPU cores; by default Node, libuv and the native compiler start a thread per core,
    // each reserving stack + allocator memory. Keep them few, and keep the compiler's allocator (mimalloc) from
    // reserving 1 GB arenas up front (value in KiB = 64 MB).
    UV_THREADPOOL_SIZE: '2',
    RAYON_NUM_THREADS: '2',
    TOKIO_WORKER_THREADS: '2',
    MIMALLOC_ARENA_RESERVE: '65536',
    MIMALLOC_ARENA_EAGER_COMMIT: '0',
    MIMALLOC_ALLOW_LARGE_OS_PAGES: '0',
  }),
};
const nextBin = path.join(nextDir, 'dist', 'bin', 'next');
const status = run(process.execPath, [nextBin, 'build', ...(useWebpack ? ['--webpack'] : [])], env);
if (status === 0) {
  // server.js only starts a build made by the Next.js version that is installed
  fs.writeFileSync(path.join(root, '.next', 'NEXT_VERSION'), nextVersion);
  console.log('\n✓ Build finished. On cPanel: click "Restart" in Setup Node.js App.');
} else if (lowResources) {
  console.log(
    '\n✖ Build failed. If it ran out of memory: click "Stop App" first and build again; otherwise use the GitHub\n' +
      '  "cPanel package" (DEPLOY_CPANEL.md) or ask your host to raise the LVE memory limit to 2 GB+.'
  );
}
process.exit(status);
