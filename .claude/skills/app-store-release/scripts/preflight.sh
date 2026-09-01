#!/usr/bin/env bash
# Preflight for a Unify iOS release. Read-only: it never mutates the repo.
# Exit 0 = safe to proceed. Exit 1 = fix the reported problem first.
set -uo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../../.." && pwd)"
APP_DIR="$REPO_ROOT/unify-front-end"
FAIL=0

pass() { printf '  \033[32mok\033[0m    %s\n' "$1"; }
fail() { printf '  \033[31mFAIL\033[0m  %s\n' "$1"; FAIL=1; }
warn() { printf '  \033[33mwarn\033[0m  %s\n' "$1"; }

echo "Unify release preflight"
echo "repo: $REPO_ROOT"
echo

cd "$APP_DIR" || { echo "missing $APP_DIR"; exit 1; }

# 1. Expo config must evaluate. Every eas command depends on this.
echo "config"
CFG_ERR="$(mktemp)"
if npx expo config --json >/dev/null 2>"$CFG_ERR"; then
  pass "npx expo config --json evaluates"
else
  fail "npx expo config --json failed:"
  sed 's/^/        /' "$CFG_ERR" | head -5
  echo "        -> usually stale node_modules; run: (cd unify-front-end && npm install)"
fi
rm -f "$CFG_ERR"

# 2. Versions.
echo
echo "version"
STORE_VERSION="$(node -e "console.log(require('$APP_DIR/app.config.js').expo.version)" 2>/dev/null)"
PKG_VERSION="$(node -e "console.log(require('$APP_DIR/package.json').version)" 2>/dev/null)"
RUNTIME="$(node -e "console.log(require('$APP_DIR/app.config.js').expo.runtimeVersion)" 2>/dev/null)"
if [ -n "$STORE_VERSION" ]; then
  pass "app.config.js version = $STORE_VERSION  (canonical)"
  pass "runtimeVersion = $RUNTIME"
else
  fail "could not read expo.version from app.config.js"
fi
[ "$STORE_VERSION" = "$PKG_VERSION" ] || \
  warn "package.json version = $PKG_VERSION (drifted; cosmetic, Expo ignores it)"

# 3. Git state.
echo
echo "git"
cd "$REPO_ROOT"
BRANCH="$(git rev-parse --abbrev-ref HEAD)"
[ "$BRANCH" = "main" ] && pass "on main" || fail "on '$BRANCH', releases build from main"

if [ -z "$(git status --porcelain --untracked-files=no)" ]; then
  pass "working tree clean (tracked files)"
else
  fail "uncommitted tracked changes:"
  git status --porcelain --untracked-files=no | sed 's/^/        /' | head -10
fi

git fetch --quiet origin main 2>/dev/null
AHEAD="$(git rev-list --count origin/main..HEAD 2>/dev/null || echo 0)"
BEHIND="$(git rev-list --count HEAD..origin/main 2>/dev/null || echo 0)"
if [ "$AHEAD" = "0" ] && [ "$BEHIND" = "0" ]; then
  pass "in sync with origin/main"
else
  fail "diverged from origin/main (ahead $AHEAD, behind $BEHIND)"
fi

# 4. Env file (app.config.js loads it at eval time).
echo
echo "env"
[ -f "$APP_DIR/.env" ] && pass ".env present" || fail ".env missing — app.config.js reads it via dotenv"

# 5. Release delta.
echo
echo "since last release"
LAST_TAG="$(git describe --tags --abbrev=0 2>/dev/null)"
if [ -n "$LAST_TAG" ]; then
  COUNT="$(git rev-list --count "$LAST_TAG"..HEAD)"
  pass "last tag $LAST_TAG — $COUNT commit(s) since"
  NATIVE="$(git diff --name-only "$LAST_TAG"..HEAD -- \
    unify-front-end/app.config.js unify-front-end/package.json \
    unify-front-end/ios unify-front-end/android 2>/dev/null)"
  if [ -n "$NATIVE" ]; then
    warn "native-sensitive files changed -> likely NEEDS A NEW BINARY, not OTA:"
    echo "$NATIVE" | sed 's/^/        /'
  else
    pass "no native-sensitive files changed (OTA may be viable — still run the Step 1 audit)"
  fi
else
  warn "no tags found"
fi

echo
if [ "$FAIL" -eq 0 ]; then
  echo "preflight passed"
else
  echo "preflight FAILED — fix the items above before releasing"
fi
exit "$FAIL"
