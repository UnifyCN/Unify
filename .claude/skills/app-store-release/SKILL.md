---
name: app-store-release
description: Ship a new Unify iOS version to the App Store, or push an Expo OTA update to the live build. Use when the user says "release", "ship an update", "new version", "push to App Store Connect", "submit to Apple", "TestFlight build", "OTA update", "eas update", "cut a release", "bump the version", or asks whether a change can go out over the air. Handles the full path: preflight, OTA-vs-binary audit, version bump, quality gates, EAS build, EAS submit, GitHub release, and App Store Connect follow-through.
metadata:
  version: 1.0.0
---

# Unify — App Store Release

Ship an iOS update. Two paths exist and picking the wrong one either wastes a
20-minute build or crashes every user on the live binary. Run the audit in
Step 1 before you touch anything.

**All commands run from `unify-front-end/`.** Nothing in this skill works from
the repo root.

## Repo facts you must not re-derive

| Fact | Value |
|---|---|
| Expo config | `unify-front-end/app.config.js` (NOT `app.json`, NOT `app.config.json`) |
| Canonical store version | `expo.version` in `app.config.js` |
| `package.json` version | **Ignored by Expo.** It has drifted before. Never read it for the store version. |
| Build number | Managed by EAS (`appVersionSource: "remote"`, `autoIncrement: "buildNumber"`). Never hand-edit. |
| Runtime version | `exposdk:55.0.0` |
| EAS project | `3772d4d9-79dd-4848-9691-bae1b19eefb8`, owner `unifysocial` |
| Bundle id | `com.anonymous.unifyfrontend` |
| App Store app | `Unify - Canada Newcomer Guide`, `ascAppId` `6754875762`, Apple Team `BA3JQQ8HVQ` |
| Listing localizations | `en-CA`, `en-US` — both need "What's New". The 4 in-app locales (en/es/hi/vi) are unrelated to the store listing. |
| Update channel | `production` (build profile `production` → channel `production`) |
| Tag format | `vX.Y.Z` |
| GitHub release title | `iOS App Version X.Y.Z` |
| Export compliance | `ITSAppUsesNonExemptEncryption: false` is already set — App Store Connect will not ask. Do not remove it. |

## Step 0 — Preflight (blocking)

Run `scripts/preflight.sh`. It must pass before anything else. It checks:

1. `npx expo config --json` evaluates. **This is the highest-value check.**
   Every EAS command (`build`, `submit`, `update`, `build:version:get`) shells
   out to it first, and when it fails EAS prints a bare
   `expo/bin/cli config --json exited with non-zero code: 1` with no cause.
   The usual cause is stale `node_modules` after a dependency change — a plugin
   listed in `app.config.js` is not installed. Fix with `npm install`, then
   re-run. Catching this here costs 5 seconds; missing it costs a failed build.
2. Working tree is clean and the branch is `main`, synced with `origin/main`.
   A release must be reproducible from a pushed commit.
3. `.env` exists (`app.config.js` calls `dotenv` at eval time).

If a check fails, fix it and re-run. Do not proceed with a dirty tree.

> The Bash sandbox swallows stderr from `expo config`. If you get an empty
> error, re-run that one command with `dangerouslyDisableSandbox: true` to see
> the real message.

## Step 1 — OTA or new binary? (the audit)

Find the last shipped release and diff against it:

```bash
git describe --tags --abbrev=0          # e.g. v1.5.1
git log --oneline <lastTag>..HEAD
git diff --name-only <lastTag>..HEAD -- \
  unify-front-end/app.config.js \
  unify-front-end/package.json \
  unify-front-end/ios unify-front-end/android
git diff <lastTag>..HEAD -- unify-front-end/app.config.js unify-front-end/package.json
```

Cross-check what is actually live:

```bash
npx eas-cli@latest build:list --platform ios --limit 3 --non-interactive
```

**Any one of these forces a new binary. OTA cannot deliver them:**

- A dependency with native code added, removed, or upgraded — including a
  package that only *looks* like JS. `react-native-*`, `expo-*` and anything
  with a config plugin all ship native code.
- A change to the `plugins` array in `app.config.js`.
- A new or changed permission / `infoPlist` string / URL scheme.
- An Expo SDK bump. This changes `runtimeVersion`, so the OTA would reach
  **zero** devices — silently. There is no error.
- App icon or splash screen changes (baked into the binary).
- Any `app.config.js` field read at build time (`name`, `bundleIdentifier`,
  `ios`, `android`, `scheme`, `runtimeVersion`).

**OTA is safe only for** JS/TS, styles, copy, i18n JSON, and runtime-loaded
assets (images that source files `require()`, e.g. `assets/images/partners/*`).

State the verdict plainly, then **stop and get confirmation before running
anything.** Both paths are outward-facing and neither is reversible.

## Step 2A — OTA path

Only after Step 1 says OTA is safe.

```bash
npx eas-cli@latest update --branch production --message "<what changed>"
```

The store version does not change. No build number, no review. Confirm the
update lists `Runtime version: exposdk:55.0.0` — if it does not, it will not
reach the live build.

Skip to Step 5 (no GitHub release for an OTA unless the user asks).

## Step 2B — New binary: bump the version

Pick the bump from the nature of the change, and say why:

- **patch** (1.5.1 → 1.5.2) — bug fixes only.
- **minor** (1.5.1 → 1.6.0) — new features, new native dependency, removed
  dependency, redesigned surface.
- **major** — only when the user asks for it.

Edit `expo.version` in `app.config.js`. That is the only version edit needed —
EAS increments the build number itself.

Optionally sync `package.json` `version` to match, purely so the two files stop
disagreeing. It has no effect on the build.

Commit on a branch, open a PR, merge to `main`. Build from `main`, not from the
branch — the tag must point at a commit that exists on `main`.

## Step 3 — Quality gates

Run the same checks CI runs (`.github/workflows/ci.yml`). A red build here is
cheaper than a rejected binary:

```bash
npm run lint
npm run check-i18n      # translation parity — hard requirement on this project
npm run typecheck
npm run test:ci
```

`check-i18n` is not optional. Every user-facing string must exist in all
locales under `i18n/locales/`; list that directory rather than assuming which
languages exist.

## Step 4 — Build, submit, release

### 4a. Build

```bash
npx eas-cli@latest build --platform ios --profile production
```

Takes roughly 15–25 minutes. Secrets come from the EAS `production`
environment, **not** from local `.env` — `.env` is never uploaded. The
production environment currently supplies `EXPO_PUBLIC_SUPABASE_URL`,
`EXPO_PUBLIC_SUPABASE_ANON_KEY`, `EXPO_PUBLIC_SANITY_*`, `EXPO_PUBLIC_POSTHOG_*`
and `EXPO_PUBLIC_AWS_*`. If you added a new `EXPO_PUBLIC_*` variable in this
release, add it to EAS first (`eas env:create --environment production`) or it
resolves to an empty string in the shipped app with no error.

### 4b. Submit to App Store Connect

```bash
npx eas-cli@latest submit --platform ios --profile production --latest --non-interactive
```

This uploads to TestFlight only. It does **not** create a store version and
does **not** submit for review.

`eas.json` already carries `ascAppId` and `appleTeamId`. Drop
`--non-interactive` if the `EXPO_ASC_*` variables are not exported in the
current shell — see the App Store Connect API key section below.

### 4c. Tag and cut the GitHub release

Do this **after** the upload succeeds, so a failed build never leaves a dangling
release. Tag the exact commit that was built:

```bash
git tag -a vX.Y.Z -m "iOS App Version X.Y.Z"
git push origin vX.Y.Z
gh release create vX.Y.Z --title "iOS App Version X.Y.Z" --notes "<notes>"
```

Notes should list user-visible changes from `git log <lastTag>..HEAD`, and name
the EAS build number for traceability.

### 4d. App Store Connect (manual — no CLI covers this)

1. Open App Store Connect → Unify.
2. Wait for the build to finish processing under **TestFlight** (5–30 min).
3. Create a new **iOS App version** `X.Y.Z` and attach that build.
4. Write **What's New** for both listing localizations, `en-CA` and `en-US`.
   Re-run `asc-setup.mjs` to confirm the list has not grown.
5. Update screenshots only if UI in the screenshots changed.
6. Promotional text / description / keywords live in the vault note
   `20 Areas/Unify/App/Apple App Store Information`. Promotional text can be
   changed without a submission; description and keywords cannot.
7. Submit for **App Review**.
8. Choose the release behaviour: manual, automatic, or phased. Recommend phased
   for anything touching auth, payments, or the Companion.

## App Store Connect API key (one-time setup)

Without a key, `eas submit` asks for an Apple ID and a password every run, and
nothing past TestFlight can be scripted. With a key, submission is
non-interactive and the App Store Connect REST API becomes available.

**1. Create the key.** App Store Connect → **Users and Access** →
**Integrations** → **App Store Connect API** → **Team Keys** → **+**.

- Name it something like `unify-eas-release`.
- Role: **App Manager**. `Developer` cannot create a store version or submit
  for review, and `Admin` grants more than this needs.

**2. Save the three values.**

- The `.p8` file. Apple lets you download it **once**. There is no second
  chance — if you lose it, revoke the key and make a new one.
- **Key ID** — 10 characters, next to the key in the list.
- **Issuer ID** — a UUID above the key list, shared by every key on the team.

**3. Store the key outside the repo.**

```bash
mkdir -p ~/.appstoreconnect/private_keys
mv ~/Downloads/AuthKey_<KEYID>.p8 ~/.appstoreconnect/private_keys/
chmod 600 ~/.appstoreconnect/private_keys/AuthKey_<KEYID>.p8
```

Never commit a `.p8`, and never paste the key, the Key ID, or the Issuer ID
into a note that syncs (the vault is read by agents). A password manager is the
right home for the backup copy.

**4. Verify it and read the app's identifiers.**

```bash
ASC_KEY_ID=<KEYID> \
ASC_ISSUER_ID=<ISSUER-UUID> \
ASC_KEY_PATH=~/.appstoreconnect/private_keys/AuthKey_<KEYID>.p8 \
node .claude/skills/app-store-release/scripts/asc-setup.mjs
```

The script is read-only. It mints a short-lived ES256 token, confirms Apple
accepts the key, then prints the app's `ascAppId`, the current App Store
versions and their states, and every listing localization that needs a
"What's New" entry. It ends with the exact JSON block for `eas.json`.

**5. `eas.json` is already filled in** with the values the script resolved:

```json
"submit": {
  "production": {
    "ios": { "ascAppId": "6754875762", "appleTeamId": "BA3JQQ8HVQ" }
  }
}
```

**6. Point EAS at the key** for a non-interactive submit. Export these three
variables in the shell that runs the submit — they keep the key on disk and out
of the repo, and they work in CI too:

```bash
export EXPO_ASC_API_KEY_PATH=~/.appstoreconnect/private_keys/AuthKey_<KEYID>.p8
export EXPO_ASC_KEY_ID=<KEYID>
export EXPO_ASC_ISSUER_ID=<ISSUER-UUID>
```

**This repo is public.** The Key ID and Issuer ID are identifiers, not secrets
— they are useless without the `.p8` — but do not commit them anyway. Keep all
three in a password manager and export them from your shell profile.

Alternatively upload the key to EAS once with
`npx eas-cli@latest credentials --platform ios` → production → App Store
Connect API Key, and every machine submits without the variables.

Step 4b then runs unattended:

```bash
npx eas-cli@latest submit --platform ios --profile production --latest --non-interactive
```

**What the key still does not do.** `eas submit` uploads to TestFlight and
stops there. Creating the store version, writing "What's New", and submitting
for review need direct App Store Connect API calls (or fastlane `deliver`).
The key is the prerequisite for that work; it is not that work. Treat Step 4d
as manual until those calls exist.

## Step 5 — Post-release

- Confirm the release is live and matches the tag.
- If a JS-only hotfix is needed on the new binary, it goes out via Step 2A —
  the runtime version still matches.
- Capture anything durable (a new footgun, a changed credential, the shipped
  version) into the vault with `vault-capture`.

## Reading a failed EAS build log

The web UI is fine for a glance, but the log is worth pulling down when you
need to grep it. It is **Brotli-compressed NDJSON**, and the signed URL expires
after 15 minutes, so fetch and decompress in one go:

```bash
npx eas-cli@latest build:view <buildId> --json > bv.json
node -e "require('fs').writeFileSync('url.txt', require('./bv.json').logFiles[0])"
curl -s "$(cat url.txt)" -o log.br          # no --compressed: it breaks the transfer
node -e "
const z=require('zlib'),fs=require('fs');
fs.writeFileSync('log.txt', z.brotliDecompressSync(fs.readFileSync('log.br')));"
```

Each line is JSON with `phase` and `msg`. Group by `phase` to find which one
failed. Logs are pruned after a few months — a build from last release may
return `NoSuchKey`, so do not plan on diffing against an old one.

## A build can break with no change from us

`unify-front-end/ios/` is gitignored, so **no `Podfile.lock` is committed and
every EAS build re-resolves CocoaPods from scratch**. A new release of a
transitive pod can break a build whose JavaScript did not change. When a build
fails and the diff looks innocent, check the pod versions in the log before
hunting through your own commits.

Seen on 2026-09-01: `GoogleSignIn 9.2.0` began pulling `AppCheckCore 11.3.1`, a
Swift pod whose dependencies `GoogleUtilities` and `RecaptchaInterop` are
non-modular Objective-C, so CocoaPods refused to integrate it as a static
library. The `@react-native-google-signin` plugin enables modular headers for
`GoogleSignIn` alone. Fixed by naming the two dependencies in
`expo-build-properties` → `ios.extraPods` with `modular_headers: true`.
Prefer that targeted form over `ios.useFrameworks: "static"`, which changes
linkage for every pod in the app.

## Footguns, ranked

| Symptom | Cause | Fix |
|---|---|---|
| Every `eas` command dies with `config --json exited with non-zero code: 1` | A plugin in `app.config.js` is not in `node_modules` (stale install) | `npm install`, re-run `npx expo config --json` |
| OTA published, nobody receives it | `runtimeVersion` changed since the live build | Ship a binary instead |
| App builds but cannot reach Supabase / Sanity | New `EXPO_PUBLIC_*` var only in local `.env` | Add it to the EAS `production` environment |
| Store version looks wrong | Read `package.json` instead of `app.config.js` | `app.config.js` is canonical |
| Build number conflict | Someone hand-edited `buildNumber` | Leave it to EAS; `appVersionSource` is `remote` |
| OTA crashes the live app | JS calls a native module the shipped binary lacks | This is Step 1's job — never skip the audit |
| `Install pods` fails: "Swift pods cannot yet be integrated as static libraries" | A transitive pod re-resolved to a version pulling a Swift pod with non-modular ObjC dependencies. No committed `Podfile.lock`, so this needs no change from us | Name the pods the error lists in `expo-build-properties` → `ios.extraPods` with `modular_headers: true` |
| Build failed and the diff looks innocent | Pods re-resolve on every build | Check pod versions in the log before blaming your commits |

## Never

- Never run `build`, `submit`, or `update` without an explicit go-ahead in this
  session. Approval for one release does not carry to the next.
- Never OTA a change that touches native code, plugins, permissions, or the
  Expo SDK.
- Never tag before the build succeeds.
- Never release from a dirty tree or a non-`main` commit.
