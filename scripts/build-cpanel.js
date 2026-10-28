// npm run build:cpanel-npm [-- https://example.com] → a finished build to upload to cPanel ("Setup Node.js App" /
// Passenger). Same method as the Water-Exchange site: build here, upload, "Run NPM Install", Restart — the server
// never builds, so its memory limit doesn't matter.
//
// Output: cpanel-npm-build/   app.js (← "Application startup file"), check-db.js, package.json (dependencies
//                                only), package-lock.json, next.config.mjs, .next/, public/
//         usacc-cpanel-npm.tar.gz
// No .env inside — the settings go in Setup Node.js App → Environment variables (or a .env next to app.js).
//
// Photos are served as uploaded (no resizing), so the site doesn't depend on the image library (sharp) running on
// the server. Pass --optimize-images to keep resizing if sharp works there.
import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const optimizeImages = args.includes('--optimize-images');
const siteUrl = (args.find((a) => !a.startsWith('--')) || 'https://cdc.multisports.com.bd').replace(/\/+$/, '');
const out = path.join(root, 'cpanel-npm-build');
const zip = path.join(root, 'usacc-cpanel-npm.tar.gz');

const step = (msg) => console.log(`\n▸ ${msg}`);
const copy = (from, to) => fs.cpSync(from, to, { recursive: true, dereference: true });

step(`Building for ${siteUrl}${optimizeImages ? '' : ' (photos served as uploaded)'}`);
execSync('npx next build', {
  cwd: root,
  stdio: 'inherit',
  env: {
    ...process.env,
    NODE_ENV: 'production',
    NEXT_TELEMETRY_DISABLED: '1',
    NEXT_PUBLIC_SITE_URL: siteUrl,
    ...(!optimizeImages && { NEXT_IMAGE_UNOPTIMIZED: '1' }),
  },
});
if (!fs.existsSync(path.join(root, '.next', 'BUILD_ID'))) {
  console.error('✖ .next/BUILD_ID was not created — the build failed.');
  process.exit(1);
}
// app.js only starts this build with the same Next.js version (installed on the server by "Run NPM Install")
const nextVersion = JSON.parse(fs.readFileSync(path.join(root, 'node_modules', 'next', 'package.json'), 'utf8')).version;
fs.writeFileSync(path.join(root, '.next', 'NEXT_VERSION'), nextVersion);

step('Assembling cpanel-npm-build/');
fs.rmSync(out, { recursive: true, force: true });
fs.mkdirSync(out);
// Build cache and dev-only files aren't needed to run the site. dereference: Turbopack links mongoose / sharp into
// .next/node_modules (directory junctions on Windows) — they go in as real folders.
const skip = new Set(['cache', 'standalone', 'dev', 'trace', 'trace-build', 'diagnostics']);
fs.cpSync(path.join(root, '.next'), path.join(out, '.next'), {
  recursive: true,
  dereference: true,
  filter: (src) => !skip.has(path.relative(path.join(root, '.next'), src).split(path.sep)[0]),
});
copy(path.join(root, 'public'), path.join(out, 'public'));
await makeThumbs(path.join(out, 'public'));
if (!optimizeImages) await shrinkPhotos(path.join(out, 'public'));
// next() reads the config at startup. The project is "type": "module", the package is CommonJS — so the config
// goes in as .mjs to stay an ES module.
copy(path.join(root, 'next.config.js'), path.join(out, 'next.config.mjs'));
// Read by next.config at startup: keeps the server's image settings the same as the build's
if (!optimizeImages) fs.writeFileSync(path.join(out, '.image-unoptimized'), 'Photos are served as uploaded (npm run build:cpanel).');

const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
fs.writeFileSync(
  path.join(out, 'package.json'),
  `${JSON.stringify(
    {
      name: pkg.name,
      version: pkg.version,
      private: true,
      type: 'commonjs',
      main: 'app.js',
      scripts: { start: 'node app.js' },
      dependencies: pkg.dependencies,
      engines: pkg.engines,
    },
    null,
    2
  )}\n`
);
// Same package versions as on this computer (npm drops the devDependencies from it on install)
copy(path.join(root, 'package-lock.json'), path.join(out, 'package-lock.json'));

fs.writeFileSync(
  path.join(out, 'app.js'),
  `// cPanel / Passenger startup file — starts the Next.js server from ./.next
// Settings (MONGO_URI, JWT_SECRET, …) come from Setup Node.js App → Environment variables; a .env file next
// to this one is read too, without overriding those.
const fs = require('node:fs');
const path = require('node:path');
const { createServer } = require('node:http');

// The site reads public/ and uploads/ relative to the working directory
process.chdir(__dirname);
const envFile = path.join(__dirname, '.env');
if (fs.existsSync(envFile))
  for (const line of fs.readFileSync(envFile, 'utf8').split(/\\r?\\n/)) {
    const m = line.match(/^\\s*([A-Z0-9_]+)\\s*=\\s*(.*)\\s*$/);
    if (m && process.env[m[1]] === undefined) process.env[m[1]] = m[2].replace(/^(['"])(.*)\\1$/, '$2');
  }
process.env.NODE_ENV = 'production';
process.env.NEXT_PUBLIC_SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || ${JSON.stringify(siteUrl)};
// Dashboard uploads live next to app.js, outside .next, so replacing .next on an update keeps them
process.env.UPLOAD_DIR = process.env.UPLOAD_DIR || path.join(__dirname, 'uploads');
fs.mkdirSync(process.env.UPLOAD_DIR, { recursive: true });

for (const key of ['MONGO_URI', 'JWT_SECRET'])
  if (!process.env[key])
    console.error(
      '✖ ' + key + ' is not set — add it in Setup Node.js App → Environment variables. If it is there, a value with a " (quote),\\n' +
        '  $ or \` in it breaks ALL the variables: remove those quotes, or move that variable into a .env file next to app.js'
    );

// Passenger passes PORT (sometimes a socket path, so it isn't parsed as a number)
const port = process.env.PORT || 3000;

// This upload was built with one Next.js version and "Run NPM Install" installs it on the server. Until both match
// the site can't work (its scripts and styles fail), so visitors get a short "updating" page and the log says why.
// The check repeats every few seconds: as soon as NPM Install has put the right version in place this process exits,
// and Passenger starts the real site on the next visit — no Restart click needed.
const builtWith = readText(path.join(__dirname, '.next', 'NEXT_VERSION'));
const nextReady = () => {
  const installed = installedNext();
  return Boolean(installed) && (!builtWith || installed === builtWith);
};
if (!nextReady()) {
  const installed = installedNext();
  console.error(
    '✖ ' + (installed ? 'Next.js ' + installed + ' is installed, but this upload needs ' + builtWith : 'Next.js is not installed') +
      ' — Setup Node.js App → Run NPM Install and wait until it finishes. The site starts by itself afterwards.'
  );
  let checkedAt = 0;
  createServer((req, res) => {
    let ready = false;
    if (Date.now() - checkedAt > 5000) {
      checkedAt = Date.now();
      ready = nextReady();
    }
    res.writeHead(503, {
      'Content-Type': 'text/html; charset=utf-8',
      'Retry-After': '30',
      'Cache-Control': 'no-store',
      'X-Update-Status': installed ? 'npm-install-needed' : 'next-not-installed',
    });
    res.end(
      '<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">' +
        '<meta http-equiv="refresh" content="30"><title>Updating</title>' +
        '<div style="font:16px/1.5 system-ui,sans-serif;max-width:32rem;margin:20vh auto;padding:0 1rem;text-align:center">' +
        '<h1 style="font-size:1.4rem">The website is being updated</h1><p>Please try again in a few minutes.</p></div>',
      () => {
        if (!ready) return;
        console.log('> Next.js ' + installedNext() + ' is installed now — starting the website');
        process.exit(0); // Passenger starts a fresh process (the real site) on the next request
      }
    );
  }).listen(port);
} else {
  start();
}

// Read from disk each time (not require's cache), so an install made while this process runs is seen
function installedNext() {
  try {
    return JSON.parse(fs.readFileSync(require.resolve('next/package.json'), 'utf8')).version;
  } catch {
    return '';
  }
}

function readText(file) {
  try {
    return fs.readFileSync(file, 'utf8').trim();
  } catch {
    return '';
  }
}

function start() {
  const next = require('next');
  const app = next({ dev: false, dir: __dirname });
  const handle = app.getRequestHandler();
  app
    .prepare()
    .then(() =>
      createServer(async (req, res) => {
        try {
          await handle(req, res);
        } catch (err) {
          // One bad request must not take the whole site down
          console.error('Error handling', req.url, err);
          if (!res.headersSent) res.statusCode = 500;
          res.end('Internal server error');
        }
      })
        .once('error', (err) => {
          if (err.code === 'EADDRINUSE')
            console.error(
              '✖ Port ' + port + ' is in use — the site is probably already running. Don\\'t start it with "Run JS script → start";\\n' +
                '  cPanel starts app.js by itself: just click Restart in Setup Node.js App and open the site.'
            );
          else console.error(err);
          process.exit(1);
        })
        .listen(port, () => console.log('> USACC website ready on ' + port))
    )
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
`
);
fs.writeFileSync(path.join(out, 'check-db.js'), checkDbSource());
// Passenger restarts the app on its next request when tmp/restart.txt changes, so extracting the upload restarts it —
// a new build never runs inside the old process (that mix answers its own scripts and styles with errors)
fs.mkdirSync(path.join(out, 'tmp'));
fs.writeFileSync(path.join(out, 'tmp', 'restart.txt'), `${new Date().toISOString()} build ${fs.readFileSync(path.join(root, '.next', 'BUILD_ID'), 'utf8')}\n`);

finish(['app.js', 'check-db.js', 'package.json', 'package-lock.json', 'next.config.mjs', ...(optimizeImages ? [] : ['.image-unoptimized']), 'tmp', 'public', '.next']);

// Small copies of the committee photos for avatars and cards: public/_thumbs/<same path>.webp, 240 px (~10 KB instead
// of 50–120 KB). src/lib/thumbs.js uses a copy when it exists.
async function makeThumbs(dir) {
  const { default: sharp } = await import('sharp');
  const sources = ['executives'].filter((d) => fs.existsSync(path.join(dir, d)));
  let count = 0;
  for (const folder of sources) {
    for (const rel of fs.readdirSync(path.join(dir, folder), { recursive: true })) {
      if (!/\.(jpe?g|png|webp)$/i.test(rel)) continue;
      const target = path.join(dir, '_thumbs', folder, rel.replace(/\.[^./\\]+$/, '.webp'));
      fs.mkdirSync(path.dirname(target), { recursive: true });
      await sharp(path.join(dir, folder, rel)).rotate().resize({ width: 240, height: 240, fit: 'inside', withoutEnlargement: true }).webp({ quality: 74 }).toFile(target);
      count += 1;
    }
  }
  console.log(`  thumbnails: ${count}`);
}

// Photos are served as uploaded, so 2–3 MB originals would go to every visitor (a gallery page of them blocks the
// browser's other requests for half a minute). Big ones are resized — 1920 px for gallery / news photos (viewed full
// screen), 1280 px for the rest (page photos) — and recompressed, keeping file name and format because the gallery in
// MongoDB stores the paths (/gallery/X.png). Files in public/ itself (logo.png, used by certificates and share images)
// and the originals in public/ are untouched.
async function shrinkPhotos(dir) {
  const { default: sharp } = await import('sharp');
  let before = 0;
  let after = 0;
  const files = fs
    .readdirSync(dir, { recursive: true })
    .filter((rel) => /\.(jpe?g|png|webp)$/i.test(rel) && path.dirname(rel) !== '.' && !rel.startsWith('_thumbs'));
  for (const rel of files) {
    const file = path.join(dir, rel);
    const stat = fs.statSync(file);
    if (stat.size < 150 * 1024) continue;
    const max = /^(gallery|news)[\\/]/.test(rel) ? 1920 : 1280;
    const input = fs.readFileSync(file);
    const ext = path.extname(file).toLowerCase();
    let img = sharp(input).rotate().resize({ width: max, height: max, fit: 'inside', withoutEnlargement: true });
    if (ext === '.png') img = img.png({ palette: true, quality: 85, effort: 8, compressionLevel: 9 });
    else if (ext === '.webp') img = img.webp({ quality: 80 });
    else img = img.jpeg({ quality: 80, mozjpeg: true });
    const output = await img.toBuffer();
    before += stat.size;
    if (output.length >= stat.size) {
      after += stat.size;
      continue;
    }
    after += output.length;
    fs.writeFileSync(file, output);
    fs.utimesSync(file, stat.atime, stat.mtime); // the folder scanner orders photos by date
  }
  const mb = (n) => (n / 1024 / 1024).toFixed(1);
  console.log(`  photos: ${mb(before)} MB → ${mb(after)} MB`);
}

function finish(entries) {
  const links = [];
  (function scan(dir) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const p = path.join(dir, entry.name);
      if (entry.isSymbolicLink()) links.push(path.relative(out, p));
      else if (entry.isDirectory()) scan(p);
    }
  })(out);
  if (links.length) console.warn(`⚠ Symlinks left in the package (copy them as real folders):\n  ${links.join('\n  ')}`);

  step(`Creating ${path.basename(zip)}`);
  fs.rmSync(zip, { force: true });
  try {
    // .tar.gz, not .zip: hosting virus scanners (Sanesecurity Foxhole.JS_Zip) reject any zip that holds .js files.
    // Windows' own bsdtar (Git's GNU tar reads "F:" as a remote host); cPanel File Manager extracts .tar.gz
    const tar = process.platform === 'win32' ? `"${path.join(process.env.SystemRoot || 'C:\\Windows', 'System32', 'tar.exe')}"` : 'tar';
    execSync(`${tar} -czf "${path.relative(out, zip)}" ${entries.join(' ')}`, { cwd: out, stdio: 'inherit' });
  } catch {
    console.warn('⚠ Could not create the archive — upload the cpanel-npm-build folder contents instead.');
  }
  console.log(`\n✔ Ready: cpanel-npm-build/${fs.existsSync(zip) ? ` and ${path.basename(zip)} (${(fs.statSync(zip).size / 1024 / 1024).toFixed(1)} MB)` : ''}`);
  console.log(
    '  Next: cPanel File Manager → upload it into the application root → Extract →\n' +
      '  Setup Node.js App: Application startup file = app.js, environment variables → Run NPM Install → Restart'
  );
}

function checkDbSource() {
  return `// Checks that this server can reach MongoDB Atlas. In cPanel → Terminal (inside the app folder):
//   node check-db.js
const fs = require('node:fs');
const path = require('node:path');
const dns = require('node:dns').promises;
const net = require('node:net');

const envFile = path.join(__dirname, '.env');
if (fs.existsSync(envFile) && typeof process.loadEnvFile === 'function') process.loadEnvFile(envFile);
const uri = process.env.MONGO_URI;
if (!uri) {
  console.log('✖ MONGO_URI is not set. Add it in Setup Node.js App → Environment variables (or .env), then run:');
  console.log('  MONGO_URI="…" node check-db.js');
  process.exit(1);
}
const host = new URL(uri.replace(/^mongodb\\+srv:/, 'http:')).hostname;

const tcp = (h, port) =>
  new Promise((resolve) => {
    const s = net.connect({ host: h, port, timeout: 8000 });
    s.on('connect', () => (s.destroy(), resolve('open')));
    s.on('timeout', () => (s.destroy(), resolve('TIMEOUT')));
    s.on('error', (e) => resolve(e.code));
  });

(async () => {
  try {
    const ip = await fetch('https://api.ipify.org').then((r) => r.text());
    console.log('This server connects from IP:', ip, '→ this IP (or 0.0.0.0/0) must be in Atlas → Network Access');
  } catch {
    console.log('(could not look up this server\\'s public IP)');
  }
  let hosts = [host];
  try {
    hosts = (await dns.resolveSrv('_mongodb._tcp.' + host)).map((r) => r.name);
    console.log('✔ DNS ok —', hosts.length, 'Atlas servers found');
  } catch (e) {
    console.log('✖ DNS lookup of', host, 'failed:', e.code, '— the host blocks DNS SRV lookups; ask them to allow it');
  }
  let open = 0;
  for (const h of hosts) {
    const r = await tcp(h, 27017);
    if (r === 'open') open += 1;
    console.log(r === 'open' ? '✔' : '✖', h + ':27017', r);
  }
  if (!open) {
    console.log('\\n✖ Port 27017 is blocked from this server. Ask your hosting support:');
    console.log('  "Please allow outgoing TCP connections on port 27017 to *.mongodb.net (MongoDB Atlas) for my account."');
    process.exit(1);
  }
  try {
    const mongoose = require('mongoose');
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 15000 });
    console.log('\\n✔ Connected to MongoDB — the website can reach the database. Restart the app in Setup Node.js App.');
    await mongoose.disconnect();
  } catch (e) {
    const reasons = [...(e?.reason?.servers?.values?.() || [])].map((s) => s.error?.message).filter(Boolean);
    console.log('\\n✖ Port is open but connecting failed:', reasons[0] || e.message);
    if (/auth/i.test(reasons[0] || e.message)) console.log('  → the username or password in MONGO_URI is wrong (Atlas → Database Access)');
    process.exit(1);
  }
})();
`;
}
