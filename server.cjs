// Startup file for cPanel → "Setup Node.js App" (Phusion Passenger). Set "Application startup file" to server.cjs.
// Passenger loads this file and routes the domain's traffic to the port it listens on. Run `npm run build` first.
// Also works anywhere else: `npm start` (PORT defaults to 3000). See DEPLOY_CPANEL.md.
// Always 'production' here (cPanel may set a non-standard value, which Next.js warns about)
process.env.NODE_ENV = 'production';

const fs = require('node:fs');
const path = require('node:path');
const { createServer } = require('node:http');

const BUILD_HELP =
  '  cPanel → Setup Node.js App → your app → "Run JS script" → choose "build" (or in the Terminal: npm run build),\n' +
  '  wait for "Build finished", then click "Restart". See DEPLOY_CPANEL.md.\n';
const stop = (message) => {
  console.error(`\n✖ ${message}\n${BUILD_HELP}`);
  process.exit(1);
};

let next;
let installed;
try {
  next = require('next');
  installed = require('next/package.json').version;
} catch {
  console.error('\n✖ Next.js is not installed for this app.\n  cPanel → Setup Node.js App → your app → "Run NPM Install", then "build" and "Restart".\n');
  process.exit(1);
}

// Check the build before starting, so a missing / half-finished / mismatched build gives clear instructions
const build = path.join(__dirname, '.next');
if (!fs.existsSync(path.join(build, 'BUILD_ID'))) stop('The website has not been built yet (no .next folder).');
if (!['routes-manifest.json', 'prerender-manifest.json', 'build-manifest.json'].every((f) => fs.existsSync(path.join(build, f)))) {
  stop('The build in .next is incomplete (the last build probably failed).');
}
const builtWith = fs.existsSync(path.join(build, 'NEXT_VERSION')) ? fs.readFileSync(path.join(build, 'NEXT_VERSION'), 'utf8').trim() : '';
if (builtWith && builtWith !== installed) {
  stop(`The build was made with Next.js ${builtWith}, but Next.js ${installed} is installed — build again on this server.`);
}

const port = Number(process.env.PORT) || 3000;
// dir = this folder, so .env and the build in .next are found whatever the working directory is
const app = next({ dev: false, dir: __dirname, port });
const handle = app.getRequestHandler();

app
  .prepare()
  .then(() => {
    createServer((req, res) => handle(req, res)).listen(port, () => {
      console.log(`> USACC website ready on port ${port} (Next.js ${installed})`);
    });
  })
  .catch((error) => {
    // A file of the build is missing → almost always a build from another Next.js version or an unfinished build
    if (error?.code === 'ENOENT' && String(error.path || '').includes(`${path.sep}.next${path.sep}`)) {
      stop(`The build in .next doesn't match this server (missing ${path.basename(error.path)}). Build again on this server.`);
    }
    console.error('Could not start the website:', error);
    process.exit(1);
  });
