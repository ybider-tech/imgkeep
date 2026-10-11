#!/usr/bin/env node
// Uploads dist/imgkeep-<version>.zip to the Chrome Web Store and submits it for review (API v2).
// Credentials live outside the repo in ~/.config/imgkeep/: cws.env (CWS_PUBLISHER_ID, CWS_EXTENSION_ID)
// and cws-service-account.json (the service account key linked in the developer dashboard).
// Usage: node scripts/cws-publish.mjs [--status | --submit | --staged | --upload-only]
//   (no option)    same as --status: nothing is uploaded or submitted unless you ask for it
//   --status       only show the store's current published and submitted versions
//   --submit       upload and submit for review; the store publishes it automatically once approved
//   --staged       upload and submit, but after approval wait for a manual Publish in the dashboard
//   --upload-only  upload the package but don't submit it (finish in the dashboard)
// Only the package is uploaded: descriptions, privacy answers and images are edited in the dashboard.
import { createSign } from 'node:crypto';
import { readFileSync, existsSync } from 'node:fs';
import { homedir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const CONFIG = join(homedir(), '.config', 'imgkeep');
const API = 'https://chromewebstore.googleapis.com';
const SCOPE = 'https://www.googleapis.com/auth/chromewebstore';

const mode = process.argv[2] || '--status';
if (!['--status', '--submit', '--upload-only', '--staged'].includes(mode)) {
  console.error(`Unknown option ${mode}`);
  process.exit(1);
}

function fail(message) {
  console.error(message);
  process.exit(1);
}

// Read values literally, like edge-publish.sh.
const env = {};
for (const line of readFileSync(join(CONFIG, 'cws.env'), 'utf8').split('\n')) {
  const m = line.match(/^(CWS_[A-Z_]+)=(.*)$/);
  if (m) env[m[1]] = m[2].trim();
}
for (const k of ['CWS_PUBLISHER_ID', 'CWS_EXTENSION_ID']) if (!env[k]) fail(`${k} is empty in ${CONFIG}/cws.env`);
const item = `publishers/${env.CWS_PUBLISHER_ID}/items/${env.CWS_EXTENSION_ID}`;

// Service account JWT → access token (https://developers.google.com/identity/protocols/oauth2/service-account).
async function accessToken() {
  const key = JSON.parse(readFileSync(join(CONFIG, 'cws-service-account.json'), 'utf8'));
  const b64 = (o) => Buffer.from(JSON.stringify(o)).toString('base64url');
  const now = Math.floor(Date.now() / 1000);
  const unsigned = `${b64({ alg: 'RS256', typ: 'JWT' })}.${b64({
    iss: key.client_email, scope: SCOPE, aud: key.token_uri, iat: now, exp: now + 3600,
  })}`;
  const signature = createSign('RSA-SHA256').update(unsigned).sign(key.private_key, 'base64url');
  const res = await fetch(key.token_uri, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: `${unsigned}.${signature}`,
    }),
  });
  const body = await res.json();
  if (!res.ok || !body.access_token) fail(`Sign-in failed (HTTP ${res.status}): ${body.error_description || body.error || ''}`);
  return body.access_token;
}

const token = await accessToken();

async function call(method, url, body, contentType) {
  const res = await fetch(url, {
    method,
    headers: { Authorization: `Bearer ${token}`, ...(contentType && { 'Content-Type': contentType }) },
    body,
  });
  const text = await res.text();
  if (!res.ok) fail(`${method} ${url.replace(API, '')} failed (HTTP ${res.status}):\n${text}`);
  return text ? JSON.parse(text) : {};
}

const status = () => call('GET', `${API}/v2/${item}:fetchStatus`);

function describe(s) {
  const rev = (r) => r
    ? `${r.state}${(r.distributionChannels || []).map((c) => ` ${c.crxVersion} (${c.deployPercentage}%)`).join(',')}`
    : 'none';
  return `Published: ${rev(s.publishedItemRevisionStatus)}\nSubmitted: ${rev(s.submittedItemRevisionStatus)}`
    + (s.takenDown ? '\nTAKEN DOWN' : '') + (s.warned ? '\nWARNED' : '');
}

if (mode === '--status') {
  console.log(describe(await status()));
  process.exit(0);
}

process.chdir(join(dirname(fileURLToPath(import.meta.url)), '..'));
const version = JSON.parse(readFileSync('extension/manifest.json', 'utf8')).version;
const zip = `dist/imgkeep-${version}.zip`;
if (!existsSync(zip)) fail(`No ${zip}. Run: sh scripts/package.sh`);

console.log(`Uploading ${zip} to the Chrome Web Store…`);
let upload = await call('POST', `${API}/upload/v2/${item}:upload`, readFileSync(zip), 'application/zip');
for (let i = 0; upload.uploadState === 'IN_PROGRESS' && i < 60; i++) {
  await new Promise((r) => setTimeout(r, 5000));
  upload = { uploadState: (await status()).lastAsyncUploadState, crxVersion: upload.crxVersion };
}
if (upload.uploadState !== 'SUCCEEDED') fail(`Upload did not succeed: ${JSON.stringify(upload)}`);
if (upload.crxVersion && upload.crxVersion !== version) fail(`Store read version ${upload.crxVersion}, manifest says ${version}`);
console.log('Upload succeeded.');

if (mode === '--upload-only') {
  console.log('Package uploaded, not submitted. Finish in the developer dashboard.');
  process.exit(0);
}

console.log(`Submitting ${version} for review${mode === '--staged' ? ' (staged: publish manually after approval)' : ''}…`);
const published = await call('POST', `${API}/v2/${item}:publish`,
  JSON.stringify({ publishType: mode === '--staged' ? 'STAGED_PUBLISH' : 'DEFAULT_PUBLISH' }), 'application/json');
if (published.warningInfo) console.log('Warnings:', JSON.stringify(published.warningInfo));
console.log(`Submitted ${version}: ${published.state}.`);
