#!/usr/bin/env bash

set -euo pipefail

readonly PROJECT_ROOT="$(cd -- "$(dirname -- "$0")/.." && pwd -P)"
readonly SYNC_SCRIPT="$PROJECT_ROOT/scripts/sync-placesyfaces.sh"
readonly SOURCE_ROOT="/Volumes/LaCie/FinalEdits"
readonly CONFIRMATION="MIRROR /Volumes/LaCie/FinalEdits to placesyfaces:placesyfaces INCLUDING DELETIONS"

fail() {
  printf 'FAIL: %s\n' "$1" >&2
  exit 1
}

assert_contains() {
  local haystack="$1"
  local needle="$2"
  [[ "$haystack" == *"$needle"* ]] || fail "expected output to contain: $needle"
}

[[ -d "$SOURCE_ROOT" ]] || fail "test requires the approved source directory to exist: $SOURCE_ROOT"

test_dir="$(mktemp -d "${TMPDIR:-/tmp}/placeyface-sync-test.XXXXXX")"
fake_bin="$test_dir/bin"
fixture_dir="$test_dir/fixtures"
rclone_log="$test_dir/rclone.log"
mkdir -p "$fake_bin" "$fixture_dir"

cleanup() {
  rm -rf -- "$test_dir"
}
trap cleanup EXIT

cat >"$fixture_dir/source.json" <<'JSON'
[
  {"Path":"2024/unchanged.jpg","Size":10,"Hashes":{"md5":"aaaaaaaa"}},
  {"Path":"2025/new.jpg","Size":11,"Hashes":{"md5":"bbbbbbbb"}},
  {"Path":"2025/moved/new-name.jpg","Size":12,"Hashes":{"md5":"cccccccc"}},
  {"Path":"2026/updated.jpg","Size":13,"Hashes":{"md5":"dddddddd"}},
  {"Path":"2026/duplicate-a.jpg","Size":14,"Hashes":{"md5":"eeeeeeee"}},
  {"Path":"2026/duplicate-b.jpg","Size":14,"Hashes":{"md5":"eeeeeeee"}}
]
JSON

cat >"$fixture_dir/destination.json" <<'JSON'
[
  {"Path":"2024/unchanged.jpg","Size":10,"Hashes":{"md5":"aaaaaaaa"}},
  {"Path":"2024/moved/old-name.jpg","Size":12,"Hashes":{"md5":"cccccccc"}},
  {"Path":"2026/updated.jpg","Size":13,"Hashes":{"md5":"ffffffff"}},
  {"Path":"2024/duplicate-old.jpg","Size":14,"Hashes":{"md5":"eeeeeeee"}},
  {"Path":"2023/removed.jpg","Size":15,"Hashes":{"md5":"99999999"}}
]
JSON

cat >"$fake_bin/rclone" <<'FAKE_RCLONE'
#!/usr/bin/env bash
set -euo pipefail

command_name="${1:-}"
shift || true

{
  printf '%s' "$command_name"
  for argument in "$@"; do
    printf '\t%s' "$argument"
  done
  printf '\n'
} >>"$RCLONE_LOG"

case "$command_name" in
  lsf)
    printf 'placesyfaces/\n'
    ;;
  lsjson)
    if [[ "${1:-}" == "placesyfaces:placesyfaces" ]]; then
      cat "$FIXTURE_DIR/destination.json"
    else
      cat "$FIXTURE_DIR/source.json"
    fi
    ;;
  sync | moveto | copyto)
    ;;
  *)
    printf 'Unexpected fake rclone command: %s\n' "$command_name" >&2
    exit 64
    ;;
esac
FAKE_RCLONE
chmod +x "$fake_bin/rclone"

export FIXTURE_DIR="$fixture_dir"
export RCLONE_LOG="$rclone_log"
export PATH="$fake_bin:$PATH"

run_apply_with_confirmation() {
  local confirmation="$1"
  python3 - "$SYNC_SCRIPT" "$SOURCE_ROOT" "$confirmation" <<'PY'
import errno
import os
import pty
import sys

script, source, confirmation = sys.argv[1:]
pid, descriptor = pty.fork()

if pid == 0:
    os.execve(script, [script, "--apply", source], os.environ)

output = bytearray()
confirmation_sent = False

while True:
    try:
        chunk = os.read(descriptor, 4096)
    except OSError as error:
        if error.errno == errno.EIO:
            break
        raise

    if not chunk:
        break

    output.extend(chunk)
    if not confirmation_sent and b"Type exactly" in output:
        os.write(descriptor, confirmation.encode() + b"\n")
        confirmation_sent = True

_, wait_status = os.waitpid(pid, 0)
sys.stdout.buffer.write(output)
raise SystemExit(os.waitstatus_to_exitcode(wait_status))
PY
}

dry_output="$($SYNC_SCRIPT "$SOURCE_ROOT" 2>&1)"
assert_contains "$dry_output" "Inventory:   6 source JPEGs; 5 destination JPEGs"
assert_contains "$dry_output" "Additions:   3 new path(s) not handled as moves"
assert_contains "$dry_output" "Updates:     1 checksum/size-changed existing path(s)"
assert_contains "$dry_output" "Moves:       1 uniquely checksum-matched path change(s)"
assert_contains "$dry_output" "Removals:    2 R2-only path(s) not handled as moves"
assert_contains "$dry_output" "1 duplicate-checksum group(s) cannot use the move optimization"
assert_contains "$dry_output" "dry run (no remote changes)"
assert_contains "$dry_output" "Dry run completed successfully; no remote changes were made."

[[ "$(grep -c '^sync' "$rclone_log")" -eq 1 ]] || fail "dry mode should run exactly one sync preview"
grep '^sync' "$rclone_log" | grep -q -- $'\t--dry-run' || fail "dry sync must include --dry-run"
grep '^sync' "$rclone_log" | grep -q -- $'\t--check-first' || fail "sync must inventory before transfer"
grep '^sync' "$rclone_log" | grep -q -- $'\t--delete-after' || fail "sync must delay deletion until transfers succeed"
grep '^sync' "$rclone_log" | grep -q -- $'\t--metadata' || fail "sync must preserve source metadata"
grep '^sync' "$rclone_log" | grep -q -- '.*\[Tt\]\[Hh\]\[Uu\]\[Mm\]\[Bb\]\[Ss\]/\*\*' || fail "thumb folders must be excluded"
grep '^sync' "$rclone_log" | grep -q -- '.*\[._-\]\[Tt\]\[Hh\]\[Uu\]\[Mm\]\[Bb\].*\[Jj\]\[Pp\]\[Gg\]' || fail "thumb JPEGs must be excluded"
[[ "$(grep -Ec '^(moveto|copyto)' "$rclone_log" || true)" -eq 0 ]] || fail "dry mode must not issue mutations"

: >"$rclone_log"

set +e
cancel_output="$(run_apply_with_confirmation "DO NOT APPLY" 2>&1)"
cancel_status=$?
set -e

[[ "$cancel_status" -eq 1 ]] || fail "incorrect confirmation must cancel with exit status 1"
assert_contains "$cancel_output" "Cancelled; no remote changes were made."
[[ "$(grep -c '^sync' "$rclone_log")" -eq 1 ]] || fail "cancelled apply should run only its dry preview"
[[ "$(grep -Ec '^(moveto|copyto)' "$rclone_log" || true)" -eq 0 ]] || fail "incorrect confirmation must not issue mutations"

: >"$rclone_log"

apply_output="$(run_apply_with_confirmation "$CONFIRMATION")"

assert_contains "$apply_output" "APPLY requested; running the required dry run first."
assert_contains "$apply_output" "Dry run completed. Review the additions, updates, moves, and removals above."
assert_contains "$apply_output" "Moving R2 object:"
assert_contains "$apply_output" "Updating changed R2 object:"
assert_contains "$apply_output" "Archive mirror completed successfully."

[[ "$(grep -c '^sync' "$rclone_log")" -eq 2 ]] || fail "apply mode should run a dry preview and one real sync"
grep '^sync' "$rclone_log" | head -1 | grep -q -- $'\t--dry-run' || fail "apply mode must preview before mutating"
if grep '^sync' "$rclone_log" | tail -1 | grep -q -- $'\t--dry-run'; then
  fail "final apply sync must not be a dry run"
fi
grep -q $'^moveto\tplacesyfaces:placesyfaces/2024/moved/old-name.jpg\tplacesyfaces:placesyfaces/2025/moved/new-name.jpg\t--immutable' "$rclone_log" || fail "unique checksum move should use a protected remote move"
grep -q $'^copyto\t/Volumes/LaCie/FinalEdits/2026/updated.jpg\tplacesyfaces:placesyfaces/2026/updated.jpg\t--metadata' "$rclone_log" || fail "same-path checksum changes should be explicitly replaced"

printf 'PASS: sync dry-run, diff plan, guarded apply, moves, updates, and delete-after mirror behavior\n'
