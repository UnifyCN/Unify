#!/usr/bin/env node
// Drive the App Store Connect steps that no CLI covers: create the store
// version, attach the build, write "What's New", and submit for review.
//
// Dry run by default. Nothing is written without --apply, and the submission
// itself additionally needs --confirm-submit.
//
//   ASC_KEY_ID=... ASC_ISSUER_ID=... ASC_KEY_PATH=... \
//     node asc-release.mjs <command> [options]
//
// Commands:
//   status                          Read-only. Versions, builds, localizations.
//   create-version --version 1.7.0  Create the store version.
//   attach-build   --version 1.7.0 --build 1.3.9
//   whats-new      --version 1.7.0 --notes-file notes.txt
//   submit         --version 1.7.0  Submit for review. Irreversible.
//   release        --version 1.7.0 --build 1.3.9 --notes-file notes.txt
//                                   All four, in order.
//
// Add --apply to execute. Add --confirm-submit to allow the submit step.

import { readFileSync } from 'node:fs';
import { makeToken, get, post, patch, ASC_APP_ID } from './asc-client.mjs';

const argv = process.argv.slice(2);
const command = argv[0];
const flag = (name) => {
  const i = argv.indexOf(`--${name}`);
  return i === -1 ? undefined : argv[i + 1];
};
const has = (name) => argv.includes(`--${name}`);

const APPLY = has('apply');
const CONFIRM_SUBMIT = has('confirm-submit');
const PLATFORM = 'IOS';

// Stay quiet when piped into `head` or `grep -q`, which close stdout early.
process.stdout.on('error', () => process.exit(0));

const say = (s = '') => console.log(s);
const act = (s) => say(`${APPLY ? '  do  ' : ' plan '} ${s}`);

function need(value, name) {
  if (!value) {
    console.error(`Missing --${name}`);
    process.exit(1);
  }
  return value;
}

// Assigned in the entry block, after the usage path, so that running with no
// arguments does not demand credentials.
let token;

// ---------- reads ----------

async function findVersion(versionString) {
  const r = await get(
    token,
    `/v1/apps/${ASC_APP_ID}/appStoreVersions?filter[versionString]=${encodeURIComponent(
      versionString,
    )}&filter[platform]=${PLATFORM}&limit=1` +
      `&fields[appStoreVersions]=versionString,appStoreState,releaseType`,
  );
  return r.data?.[0] ?? null;
}

async function findBuild(buildNumber) {
  const r = await get(
    token,
    `/v1/builds?filter[app]=${ASC_APP_ID}&filter[version]=${encodeURIComponent(
      buildNumber,
    )}&limit=1&fields[builds]=version,processingState,expired`,
  );
  return r.data?.[0] ?? null;
}

async function localizations(versionId) {
  const r = await get(
    token,
    `/v1/appStoreVersions/${versionId}/appStoreVersionLocalizations` +
      `?limit=50&fields[appStoreVersionLocalizations]=locale,whatsNew`,
  );
  return r.data ?? [];
}

// ---------- commands ----------

async function status() {
  const versions = await get(
    token,
    `/v1/apps/${ASC_APP_ID}/appStoreVersions?limit=5` +
      `&fields[appStoreVersions]=versionString,appStoreState,releaseType`,
  );
  say('App Store versions:');
  for (const v of versions.data ?? []) {
    const a = v.attributes;
    say(`  ${String(a.versionString).padEnd(10)} ${String(a.appStoreState).padEnd(22)} ${a.releaseType}`);
  }

  const builds = await get(
    token,
    `/v1/builds?filter[app]=${ASC_APP_ID}&limit=5&sort=-uploadedDate` +
      `&fields[builds]=version,processingState,uploadedDate`,
  );
  say('\nBuilds:');
  for (const b of builds.data ?? []) {
    const a = b.attributes;
    say(`  ${String(a.version).padEnd(10)} ${String(a.processingState).padEnd(12)} ${a.uploadedDate}`);
  }

  const newest = versions.data?.[0];
  if (newest) {
    say(`\n"What's New" on ${newest.attributes.versionString}:`);
    for (const l of await localizations(newest.id)) {
      const w = (l.attributes.whatsNew || '').trim();
      say(`  ${l.attributes.locale.padEnd(8)} ${w ? `${w.length} chars` : 'EMPTY'}`);
    }
  }
}

async function createVersion(versionString) {
  const existing = await findVersion(versionString);
  if (existing) {
    say(`  ok   version ${versionString} already exists (${existing.attributes.appStoreState})`);
    return existing.id;
  }
  act(`create version ${versionString}`);
  if (!APPLY) return null;

  const r = await post(token, '/v1/appStoreVersions', {
    data: {
      type: 'appStoreVersions',
      attributes: { platform: PLATFORM, versionString },
      relationships: { app: { data: { type: 'apps', id: ASC_APP_ID } } },
    },
  });
  say(`  ok   created ${versionString}`);
  return r.data.id;
}

async function attachBuild(versionId, versionString, buildNumber) {
  const build = await findBuild(buildNumber);
  if (!build) throw new Error(`No build ${buildNumber} found for this app.`);
  if (build.attributes.processingState !== 'VALID') {
    throw new Error(
      `Build ${buildNumber} is ${build.attributes.processingState}, not VALID. ` +
        'Apple is still processing it — wait and retry.',
    );
  }
  act(`attach build ${buildNumber} to ${versionString}`);
  if (!APPLY || !versionId) return;

  await patch(token, `/v1/appStoreVersions/${versionId}/relationships/build`, {
    data: { type: 'builds', id: build.id },
  });
  say(`  ok   attached ${buildNumber}`);
}

async function whatsNew(versionId, versionString, notes) {
  if (!versionId) {
    act(`write "What's New" (${notes.length} chars) to every localization`);
    return;
  }
  const locs = await localizations(versionId);
  if (!locs.length) throw new Error('No localizations on this version.');

  for (const l of locs) {
    act(`write "What's New" (${notes.length} chars) to ${l.attributes.locale}`);
    if (!APPLY) continue;
    await patch(token, `/v1/appStoreVersionLocalizations/${l.id}`, {
      data: {
        type: 'appStoreVersionLocalizations',
        id: l.id,
        attributes: { whatsNew: notes },
      },
    });
    say(`  ok   ${l.attributes.locale}`);
  }
}

async function submit(versionId, versionString) {
  act(`SUBMIT ${versionString} for App Review`);
  if (!APPLY) return;
  if (!CONFIRM_SUBMIT) {
    console.error(
      '\nRefusing to submit without --confirm-submit.\n' +
        'Submitting for review is outward-facing and cannot be undone silently.',
    );
    process.exit(1);
  }
  if (!versionId) throw new Error('No version id to submit.');

  const sub = await post(token, '/v1/reviewSubmissions', {
    data: {
      type: 'reviewSubmissions',
      attributes: { platform: PLATFORM },
      relationships: { app: { data: { type: 'apps', id: ASC_APP_ID } } },
    },
  });
  const subId = sub.data.id;

  await post(token, '/v1/reviewSubmissionItems', {
    data: {
      type: 'reviewSubmissionItems',
      relationships: {
        reviewSubmission: { data: { type: 'reviewSubmissions', id: subId } },
        appStoreVersion: { data: { type: 'appStoreVersions', id: versionId } },
      },
    },
  });

  await patch(token, `/v1/reviewSubmissions/${subId}`, {
    data: { type: 'reviewSubmissions', id: subId, attributes: { submitted: true } },
  });
  say(`  ok   submitted ${versionString} for review (submission ${subId})`);
}

// ---------- entry ----------

const notesFrom = () => {
  const f = need(flag('notes-file'), 'notes-file');
  const notes = readFileSync(f, 'utf8').trim();
  if (!notes) throw new Error(`${f} is empty.`);
  if (notes.length > 4000) throw new Error(`"What's New" is ${notes.length} chars; Apple caps it at 4000.`);
  return notes;
};

const COMMANDS = ['status', 'create-version', 'attach-build', 'whats-new', 'submit', 'release'];

if (!COMMANDS.includes(command)) {
  say(
    readFileSync(new URL(import.meta.url), 'utf8')
      .split('\n')
      .slice(1, 22)
      .join('\n')
      .replace(/^\/\/ ?/gm, ''),
  );
  process.exit(command ? 1 : 0);
}

try {
  token = makeToken();

  if (!APPLY && command !== 'status') {
    say('DRY RUN — nothing is written. Add --apply to execute.\n');
  }

  switch (command) {
    case 'status':
      await status();
      break;

    case 'create-version':
      await createVersion(need(flag('version'), 'version'));
      break;

    case 'attach-build': {
      const v = need(flag('version'), 'version');
      const found = await findVersion(v);
      await attachBuild(found?.id, v, need(flag('build'), 'build'));
      break;
    }

    case 'whats-new': {
      const v = need(flag('version'), 'version');
      const found = await findVersion(v);
      await whatsNew(found?.id, v, notesFrom());
      break;
    }

    case 'submit': {
      const v = need(flag('version'), 'version');
      const found = await findVersion(v);
      await submit(found?.id, v);
      break;
    }

    case 'release': {
      const v = need(flag('version'), 'version');
      const b = need(flag('build'), 'build');
      const notes = notesFrom();
      const id = await createVersion(v);
      await attachBuild(id, v, b);
      await whatsNew(id, v, notes);
      await submit(id, v);
      break;
    }
  }
} catch (err) {
  console.error(`\n${err.message}`);
  process.exit(1);
}
