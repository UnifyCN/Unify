// Minimal App Store Connect API client. Zero dependencies, Node 18+.
// Shared by asc-setup.mjs and asc-release.mjs.

import { createSign } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { homedir } from 'node:os';

export const API = 'https://api.appstoreconnect.apple.com';
export const BUNDLE_ID = 'com.anonymous.unifyfrontend';
export const ASC_APP_ID = '6754875762';

const b64url = (buf) =>
  Buffer.from(buf)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

/** Reads ASC_KEY_ID / ASC_ISSUER_ID / ASC_KEY_PATH and mints a 10-minute ES256 token. */
export function makeToken() {
  const missing = ['ASC_KEY_ID', 'ASC_ISSUER_ID', 'ASC_KEY_PATH'].filter(
    (k) => !process.env[k],
  );
  if (missing.length) {
    throw new Error(
      `Missing env var(s): ${missing.join(', ')}\n` +
        'See SKILL.md "App Store Connect API key" for where each one comes from.',
    );
  }

  const keyPath = process.env.ASC_KEY_PATH.replace(/^~/, homedir());
  let privateKey;
  try {
    privateKey = readFileSync(keyPath, 'utf8');
  } catch {
    throw new Error(`Cannot read the key file: ${keyPath}`);
  }
  if (!privateKey.includes('BEGIN PRIVATE KEY')) {
    throw new Error(`${keyPath} is not a .p8 private key.`);
  }

  const now = Math.floor(Date.now() / 1000);
  const body =
    b64url(JSON.stringify({ alg: 'ES256', kid: process.env.ASC_KEY_ID, typ: 'JWT' })) +
    '.' +
    b64url(
      JSON.stringify({
        iss: process.env.ASC_ISSUER_ID,
        iat: now,
        exp: now + 600, // Apple rejects anything over 20 minutes.
        aud: 'appstoreconnect-v1',
      }),
    );

  const signer = createSign('SHA256');
  signer.update(body);
  signer.end();
  // ASC wants a JOSE signature (raw r||s), not the DER default.
  const sig = signer.sign({ key: privateKey, dsaEncoding: 'ieee-p1363' });
  return `${body}.${b64url(sig)}`;
}

async function request(token, method, path, body) {
  const res = await fetch(`${API}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(body ? { 'Content-Type': 'application/json' } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });

  const text = await res.text();
  if (!res.ok) {
    let detail = text;
    try {
      detail =
        JSON.parse(text)
          .errors?.map((e) => `${e.title}: ${e.detail}`)
          .join('\n') ?? text;
    } catch {}
    throw new Error(`${method} ${path} -> ${res.status}\n${detail}`);
  }
  return text ? JSON.parse(text) : null;
}

export const get = (token, path) => request(token, 'GET', path);
export const post = (token, path, body) => request(token, 'POST', path, body);
export const patch = (token, path, body) => request(token, 'PATCH', path, body);
