#!/usr/bin/env node
// Verify an App Store Connect API key and print the eas.json submit block.
// Zero dependencies. Node 18+.
//
// Usage:
//   ASC_KEY_ID=XXXXXXXXXX \
//   ASC_ISSUER_ID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx \
//   ASC_KEY_PATH=~/.appstoreconnect/private_keys/AuthKey_XXXXXXXXXX.p8 \
//   node asc-setup.mjs
//
// Reads only. It creates nothing in App Store Connect.

import { createSign } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { homedir } from 'node:os';

const BUNDLE_ID = 'com.anonymous.unifyfrontend';
const API = 'https://api.appstoreconnect.apple.com';

const { ASC_KEY_ID, ASC_ISSUER_ID, ASC_KEY_PATH } = process.env;

const missing = ['ASC_KEY_ID', 'ASC_ISSUER_ID', 'ASC_KEY_PATH'].filter(
  (k) => !process.env[k],
);
if (missing.length) {
  console.error(`Missing env var(s): ${missing.join(', ')}`);
  console.error('See SKILL.md "App Store Connect API key" for where each one comes from.');
  process.exit(1);
}

const keyPath = ASC_KEY_PATH.replace(/^~/, homedir());
let privateKey;
try {
  privateKey = readFileSync(keyPath, 'utf8');
} catch {
  console.error(`Cannot read the key file: ${keyPath}`);
  process.exit(1);
}
if (!privateKey.includes('BEGIN PRIVATE KEY')) {
  console.error(`${keyPath} is not a .p8 private key.`);
  process.exit(1);
}

const b64url = (buf) =>
  Buffer.from(buf).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

function mintToken() {
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: 'ES256', kid: ASC_KEY_ID, typ: 'JWT' };
  const payload = {
    iss: ASC_ISSUER_ID,
    iat: now,
    exp: now + 600, // Apple rejects anything over 20 minutes.
    aud: 'appstoreconnect-v1',
  };
  const body = `${b64url(JSON.stringify(header))}.${b64url(JSON.stringify(payload))}`;
  const signer = createSign('SHA256');
  signer.update(body);
  signer.end();
  // ASC wants a JOSE signature (raw r||s), not the DER default.
  const sig = signer.sign({ key: privateKey, dsaEncoding: 'ieee-p1363' });
  return `${body}.${b64url(sig)}`;
}

async function get(path, token) {
  const res = await fetch(`${API}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const text = await res.text();
  if (!res.ok) {
    let detail = text;
    try {
      detail = JSON.parse(text).errors?.map((e) => `${e.title}: ${e.detail}`).join('\n') ?? text;
    } catch {}
    throw new Error(`GET ${path} -> ${res.status}\n${detail}`);
  }
  return JSON.parse(text);
}

const token = mintToken();

// 1. Prove the key works and read the team id off the key's own record.
let teamId = null;
try {
  const me = await get('/v1/users?limit=1', token);
  console.log('key accepted by App Store Connect');
  void me;
} catch (err) {
  console.error('The key was rejected. Check ASC_KEY_ID, ASC_ISSUER_ID and the .p8 file.');
  console.error(String(err.message).split('\n').slice(0, 4).join('\n'));
  process.exit(1);
}

// 2. Find the app.
const apps = await get(
  `/v1/apps?filter[bundleId]=${encodeURIComponent(BUNDLE_ID)}&limit=1`,
  token,
);
const app = apps.data?.[0];
if (!app) {
  console.error(`No app found for bundle id ${BUNDLE_ID} under this key's team.`);
  process.exit(1);
}

const ascAppId = app.id;
const { name, sku, primaryLocale } = app.attributes;

// 3. Current App Store versions, newest first.
const versions = await get(
  `/v1/apps/${ascAppId}/appStoreVersions?limit=5&fields[appStoreVersions]=versionString,appStoreState,createdDate`,
  token,
);

console.log('');
console.log(`app             ${name}`);
console.log(`bundle id       ${BUNDLE_ID}`);
console.log(`ascAppId        ${ascAppId}`);
console.log(`sku             ${sku}`);
console.log(`primary locale  ${primaryLocale}`);
console.log('');
console.log('App Store versions:');
for (const v of versions.data ?? []) {
  const a = v.attributes;
  console.log(`  ${String(a.versionString).padEnd(10)} ${a.appStoreState}`);
}

// 4. Listing localizations on the newest version — every one needs "What's New".
const newest = versions.data?.[0];
if (newest) {
  try {
    const locs = await get(
      `/v1/appStoreVersions/${newest.id}/appStoreVersionLocalizations?limit=50&fields[appStoreVersionLocalizations]=locale`,
      token,
    );
    const locales = (locs.data ?? []).map((l) => l.attributes.locale);
    console.log('');
    console.log(`listing localizations (${locales.length}): ${locales.join(', ') || 'none'}`);
    console.log("  -> \"What's New\" must be written for each one.");
  } catch {
    console.log('\n(could not read listing localizations — key may lack App Manager role)');
  }
}

console.log('');
console.log('Paste into unify-front-end/eas.json under "submit":');
console.log(
  JSON.stringify(
    { production: { ios: { ascAppId, appleTeamId: teamId ?? '<your 10-char Apple Team ID>' } } },
    null,
    2,
  ),
);
