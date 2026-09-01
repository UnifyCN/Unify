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

import { makeToken, get, BUNDLE_ID } from './asc-client.mjs';

let token;
try {
  token = makeToken();
} catch (err) {
  console.error(err.message);
  process.exit(1);
}

// 1. Prove the key works before doing anything else.
try {
  await get(token, '/v1/users?limit=1');
  console.log('key accepted by App Store Connect');
} catch (err) {
  console.error('The key was rejected. Check ASC_KEY_ID, ASC_ISSUER_ID and the .p8 file.');
  console.error(String(err.message).split('\n').slice(0, 4).join('\n'));
  process.exit(1);
}

// 2. Find the app.
const apps = await get(
  token,
  `/v1/apps?filter[bundleId]=${encodeURIComponent(BUNDLE_ID)}&limit=1`,
);
const app = apps.data?.[0];
if (!app) {
  console.error(`No app found for bundle id ${BUNDLE_ID} under this key's team.`);
  process.exit(1);
}

const ascAppId = app.id;
const { name, sku, primaryLocale } = app.attributes;

// 2b. The Apple Team ID is not on the app record. It is the `seedId` of the
// matching Developer-portal bundle id.
let teamId = null;
try {
  const bundles = await get(
    token,
    `/v1/bundleIds?filter[identifier]=${encodeURIComponent(BUNDLE_ID)}&limit=1&fields[bundleIds]=identifier,seedId`,
  );
  teamId = bundles.data?.[0]?.attributes?.seedId ?? null;
} catch {
  // App Manager cannot always read Developer-portal resources.
}

// 3. Current App Store versions, newest first.
const versions = await get(
  token,
  `/v1/apps/${ascAppId}/appStoreVersions?limit=5&fields[appStoreVersions]=versionString,appStoreState,createdDate`,
);

console.log('');
console.log(`app             ${name}`);
console.log(`bundle id       ${BUNDLE_ID}`);
console.log(`ascAppId        ${ascAppId}`);
console.log(`sku             ${sku}`);
console.log(`primary locale  ${primaryLocale}`);
console.log(`appleTeamId     ${teamId ?? '(not readable with this key role)'}`);
console.log('');
console.log('App Store versions:');
for (const v of versions.data ?? []) {
  const a = v.attributes;
  console.log(`  ${String(a.versionString).padEnd(10)} ${a.appStoreState}`);
}

// 4. Listing localizations on the newest version - every one needs "What's New".
const newest = versions.data?.[0];
if (newest) {
  try {
    const locs = await get(
      token,
      `/v1/appStoreVersions/${newest.id}/appStoreVersionLocalizations?limit=50&fields[appStoreVersionLocalizations]=locale`,
    );
    const locales = (locs.data ?? []).map((l) => l.attributes.locale);
    console.log('');
    console.log(`listing localizations (${locales.length}): ${locales.join(', ') || 'none'}`);
    console.log('  -> "What\'s New" must be written for each one.');
  } catch {
    console.log('\n(could not read listing localizations - key may lack App Manager role)');
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
