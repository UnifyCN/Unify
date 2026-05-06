#!/usr/bin/env node
// Asserts that all locale translation files have an identical key shape.
// Run via `npm run check-i18n` — exits non-zero if any locale is missing keys
// or has extras vs the EN baseline.
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const localesDir = join(__dirname, '..', 'i18n', 'locales');
const LOCALES = ['en', 'vi', 'es', 'hi'];
const BASELINE = 'en';

function flatten(obj, prefix = '') {
  const out = {};
  for (const [k, v] of Object.entries(obj)) {
    const key = prefix ? `${prefix}.${k}` : k;
    if (v !== null && typeof v === 'object' && !Array.isArray(v)) {
      Object.assign(out, flatten(v, key));
    } else {
      out[key] = v;
    }
  }
  return out;
}

function load(lang) {
  const path = join(localesDir, lang, 'translation.json');
  return flatten(JSON.parse(readFileSync(path, 'utf8')));
}

const baseline = load(BASELINE);
let hasError = false;

for (const lang of LOCALES) {
  if (lang === BASELINE) continue;
  const other = load(lang);
  const missing = Object.keys(baseline).filter(k => !(k in other));
  const extra = Object.keys(other).filter(k => !(k in baseline));
  if (missing.length === 0 && extra.length === 0) {
    console.log(`✔ ${lang}: ${Object.keys(other).length} keys (matches ${BASELINE})`);
  } else {
    hasError = true;
    console.error(`✗ ${lang}: drift vs ${BASELINE}`);
    if (missing.length) {
      console.error(`  missing (${missing.length}): ${missing.slice(0, 10).join(', ')}${missing.length > 10 ? '...' : ''}`);
    }
    if (extra.length) {
      console.error(`  extra (${extra.length}): ${extra.slice(0, 10).join(', ')}${extra.length > 10 ? '...' : ''}`);
    }
  }
}

if (hasError) {
  console.error('\ni18n parity check FAILED. Run translations to bring locales in sync.');
  process.exit(1);
}
console.log(`\ni18n parity OK: ${Object.keys(baseline).length} keys per locale.`);
