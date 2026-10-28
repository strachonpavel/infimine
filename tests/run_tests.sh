#!/usr/bin/env bash
# Test runner for infimine.html.
# Each harness is appended to a copy of the game and the page is opened in headless
# chromium (fresh profile per test, so localStorage never leaks between tests).
# The legacy chain (old version -> new version) shares one profile on purpose.
#
# Usage:  tests/run_tests.sh          (override browser: CHROME=google-chrome tests/run_tests.sh)
set -u

DIR="$(cd "$(dirname "$0")" && pwd)"
REPO="$(dirname "$DIR")"
GAME="$REPO/infimine.html"
CHROME="${CHROME:-chromium}"
WORK="$(mktemp -d "${TMPDIR:-/tmp}/infimine-tests.XXXXXX")"
FAIL=0
trap 'rm -rf "$WORK"' EXIT

# run <label> <profile> <harness file>  - profile is reused when it already exists
run() {
  local label="$1" prof="$2" harness="$3"
  local f="$WORK/page_${prof}.html"
  cp "$GAME" "$f"
  [ -n "$harness" ] && cat "$DIR/$harness" >> "$f"
  local dom="$WORK/dom_${prof}.html" logf="$WORK/log_${prof}.txt"
  timeout 60 "$CHROME" --headless=new --no-sandbox --disable-gpu \
    --user-data-dir="$WORK/profile_$prof" --enable-logging=stderr --v=0 \
    --virtual-time-budget=15000 --dump-dom "file://$f" > "$dom" 2> "$logf"
  local errs body n_ok n_fail
  errs=$(grep -icE 'uncaught|referenceerror|syntaxerror|typeerror' "$logf")
  body=$(sed -n '/<pre id="t">/,/<\/pre>/p' "$dom" | sed 's/<[^>]*>//g' | grep -v '^[[:space:]]*$' | tr '\n' ' ')
  n_ok=$(printf '%s' "$body" | grep -o '\bok\b' | wc -l)
  n_fail=$(printf '%s' "$body" | grep -cE 'FAILED|EXC=|NO_API|MISSING|END_NOT_FOUND')
  if [ "$errs" -gt 0 ] || [ "$n_fail" -gt 0 ] || [ "$n_ok" -eq 0 ]; then
    echo "FAIL  $label (JS errors: $errs, failed: $n_fail)"
    echo "      $body"
    FAIL=1
  else
    echo "ok    $label ($n_ok checks)"
  fi
}

static_check() { # <label> <extended grep pattern> - the pattern must be present
  if grep -qE "$2" "$GAME"; then
    echo "ok    static: $1"
  else
    echo "FAIL  static: $1"
    FAIL=1
  fi
}

static_absent() { # <label> <extended grep pattern> - the pattern must NOT be present
  if grep -qE "$2" "$GAME"; then
    echo "FAIL  static: $1"
    FAIL=1
  else
    echo "ok    static: $1"
  fi
}

echo "=== infimine test battery (chromium: $CHROME) ==="

# 0) the ORIGINAL pre-refactor version saves a legacy game into the shared profile
git -C "$REPO" show 76ac060:infimine.html > "$WORK/old.html"
cat "$DIR/legacy_seed.js" >> "$WORK/old.html"
timeout 60 "$CHROME" --headless=new --no-sandbox --disable-gpu \
  --user-data-dir="$WORK/profile_legacy" --virtual-time-budget=8000 \
  --dump-dom "file://$WORK/old.html" > "$WORK/old_dom.html" 2>/dev/null
if grep -q 'LEGACY_SAVED' "$WORK/old_dom.html"; then
  echo "ok    legacy seed (old version saved a game)"
else
  echo "FAIL  legacy seed (old version did not save)"
  FAIL=1
fi

# 1) shared-profile chain: legacy save -> new version
run "legacy save -> new version" legacy legacy_phase2.js
run "ui state (19 keys, round-trip)" legacy ui_state.js

# 2) independent tests, each with a fresh profile
run "event delegation / controls" reg regression.js
run "model purity / deterministic RNG" pure pure.js
run "timer (start, pause, save, end)" timer timer.js
run "score (lower is better)" score score.js
run "new best badges" best best.js
run "auto-save + auto-restore + tab pause" autosave autosave.js
run "end of game reveal (mines, wrong flags)" end endreveal.js
run "dark theme (media query)" dark darkmode.js
run "disk load" disk diskload.js
run "poisoned storage" rob robust.js

# 3) static guards
static_check "strict mode" "'use strict';"
static_absent "no invalid tooltip= attribute" 'tooltip='
static_absent "no external script dependencies" '<script[^>]*src='

echo "=== done: $([ "$FAIL" -eq 0 ] && echo ALL OK || echo FAILURES) ==="
exit "$FAIL"
