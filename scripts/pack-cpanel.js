// npm run pack:cpanel → deploy/usacc-cpanel.tar.gz: the source code to upload to cPanel (File Manager → Upload →
// Extract). Leaves out node_modules, the build (.next), secrets (.env*), uploaded images and local folders —
// on the server run "Run NPM Install" and `npm run build` (see DEPLOY_CPANEL.md).
//
// npm run pack:cpanel -- --with-build → deploy/usacc-cpanel-built.tar.gz: also includes the finished build (.next,
// without its cache) for servers too small to build. Make that build on LINUX (GitHub Actions workflow
// .github/workflows/cpanel-package.yml, WSL…) — a Windows build contains Windows paths.
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outDir = path.join(root, 'deploy');
const withBuild = process.argv.includes('--with-build');
const out = path.join(outDir, withBuild ? 'usacc-cpanel-built.tar.gz' : 'usacc-cpanel.tar.gz');

if (withBuild && !fs.existsSync(path.join(root, '.next', 'BUILD_ID'))) {
  console.error('No build found — run `npm run build` first.');
  process.exit(1);
}
if (withBuild && process.platform === 'win32') {
  console.warn('⚠ This build was made on Windows. For cPanel (Linux) use the GitHub Actions workflow "cPanel package" instead.');
}

const EXCLUDE = [
  './node_modules', withBuild ? './.next/cache' : './.next', './.git', './deploy', './uploads', './.env', './.env.local', './.env.*.local', './.vercel', './.claude',
  '*.log', '.DS_Store',
];

fs.mkdirSync(outDir, { recursive: true });
if (fs.existsSync(out)) fs.rmSync(out);

const args = ['-czf', path.relative(root, out).split(path.sep).join('/'), ...EXCLUDE.flatMap((p) => ['--exclude', p]), '.'];
const result = spawnSync('tar', args, { cwd: root, stdio: 'inherit' });
if (result.status !== 0) {
  console.error('Packing failed — is the "tar" command available? (Windows 10+, macOS and Linux include it.)');
  process.exit(result.status || 1);
}
const mb = (fs.statSync(out).size / 1024 / 1024).toFixed(1);
console.log(`\nCreated ${path.relative(root, out)} (${mb} MB)`);
console.log('Next: cPanel → File Manager → upload it into the application root → Extract → follow DEPLOY_CPANEL.md');
