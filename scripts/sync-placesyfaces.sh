#!/usr/bin/env bash

set -euo pipefail

readonly APPROVED_SOURCE_ROOT="/Volumes/LaCie/FinalEdits"
readonly RCLONE_REMOTE="placesyfaces:"
readonly DESTINATION="placesyfaces:placesyfaces"
readonly APPLY_CONFIRMATION="APPLY NEW FILES AND CONFIRMED MOVES to placesyfaces:placesyfaces"

usage() {
  cat <<'USAGE'
Usage:
  scripts/sync-placesyfaces.sh /Volumes/LaCie/FinalEdits
  scripts/sync-placesyfaces.sh --apply /Volumes/LaCie/FinalEdits

The default mode is a non-mutating rclone dry run. Apply mode requires both
the --apply flag and an interactive confirmation. It uploads new object keys
and relocates uniquely checksum-matched moves. Other existing destination
objects are never replaced or deleted.
USAGE
}

fail() {
  printf 'Error: %s\n' "$1" >&2
  exit 2
}

apply=false

if [[ "${1:-}" == "--apply" ]]; then
  apply=true
  shift
fi

if [[ $# -ne 1 ]]; then
  usage >&2
  exit 2
fi

if [[ "$apply" == true && ! -t 0 ]]; then
  fail "apply mode requires an interactive terminal."
fi

source_input="$1"

command -v rclone >/dev/null 2>&1 || fail "rclone is not installed or is not on PATH."
command -v python3 >/dev/null 2>&1 || fail "python3 is not installed or is not on PATH."
[[ -d "$source_input" ]] || fail "source folder does not exist or is not a directory: $source_input"
[[ ! -L "$source_input" ]] || fail "source folder must not be a symbolic link: $source_input"

source_root="$(cd -- "$source_input" && pwd -P)"
approved_source_root="$(cd -- "$APPROVED_SOURCE_ROOT" && pwd -P)"

if [[ "$source_root" != "$approved_source_root" ]]; then
  fail "source must resolve to the approved root: $APPROVED_SOURCE_ROOT"
fi

if ! remote_roots="$(rclone lsf "$RCLONE_REMOTE" --dirs-only --max-depth 1)"; then
  fail "could not read the configured placesyfaces rclone remote."
fi

if [[ $'\n'"$remote_roots"$'\n' != *$'\nplacesyfaces/\n'* ]]; then
  fail "the placesyfaces bucket is not available through the configured placesyfaces remote."
fi

filter_args=(
  --filter "- *.large/**"
  --filter "- *.medium/**"
  --filter "- .*/**"
  --filter "- ._*"
  --filter "+ **/"
  --filter "+ *.{{(?i)jpe?g}}"
  --filter "- **"
)

work_dir="$(mktemp -d "${TMPDIR:-/tmp}/placeyface-r2-sync.XXXXXX")" || fail "could not create a temporary work folder."
source_inventory="$work_dir/source.json"
destination_inventory="$work_dir/destination.json"
move_plan="$work_dir/moves"

cleanup() {
  rm -f -- "$source_inventory" "$destination_inventory" "$move_plan"
  rmdir -- "$work_dir" 2>/dev/null || true
}
trap cleanup EXIT

printf 'Inspecting source and destination paths and checksums...\n'

if ! rclone lsjson "$source_root" --recursive --files-only --hash --hash-type MD5 "${filter_args[@]}" >"$source_inventory"; then
  fail "could not inventory the approved source folder."
fi

if ! rclone lsjson "$DESTINATION" --recursive --files-only --hash --hash-type MD5 "${filter_args[@]}" >"$destination_inventory"; then
  fail "could not inventory the placesyfaces bucket."
fi

if ! plan_summary="$(python3 - "$source_inventory" "$destination_inventory" "$move_plan" <<'PY'
import collections
import json
import sys


def load_inventory(path):
    with open(path, encoding="utf-8") as inventory_file:
        rows = json.load(inventory_file)

    inventory = {}
    for row in rows:
        object_path = row.get("Path")
        hashes = {
            str(name).lower(): str(value).lower()
            for name, value in row.get("Hashes", {}).items()
            if value
        }
        if not object_path or object_path in inventory:
            raise ValueError(f"invalid or duplicate inventory path: {object_path!r}")
        inventory[object_path] = (int(row.get("Size", -1)), hashes.get("md5"))
    return inventory


source = load_inventory(sys.argv[1])
destination = load_inventory(sys.argv[2])

new_source = {path: fingerprint for path, fingerprint in source.items() if path not in destination}
old_destination = {path: fingerprint for path, fingerprint in destination.items() if path not in source}

new_by_fingerprint = collections.defaultdict(list)
old_by_fingerprint = collections.defaultdict(list)

for path, fingerprint in new_source.items():
    if fingerprint[0] >= 0 and fingerprint[1]:
        new_by_fingerprint[fingerprint].append(path)

for path, fingerprint in old_destination.items():
    if fingerprint[0] >= 0 and fingerprint[1]:
        old_by_fingerprint[fingerprint].append(path)

moves = []
ambiguous_groups = 0
for fingerprint in sorted(set(new_by_fingerprint) & set(old_by_fingerprint)):
    new_paths = sorted(new_by_fingerprint[fingerprint])
    old_paths = sorted(old_by_fingerprint[fingerprint])
    if len(new_paths) == 1 and len(old_paths) == 1:
        moves.append((old_paths[0], new_paths[0]))
    else:
        ambiguous_groups += 1

with open(sys.argv[3], "wb") as plan_file:
    for old_path, new_path in sorted(moves):
        plan_file.write(old_path.encode("utf-8") + b"\0")
        plan_file.write(new_path.encode("utf-8") + b"\0")

print(len(source), len(destination), len(moves), ambiguous_groups)
PY
)"; then
  fail "could not compare source and destination inventories."
fi

read -r source_count destination_count move_count ambiguous_count <<<"$plan_summary"

printf 'Inventory:   %s source JPEGs; %s destination JPEGs\n' "$source_count" "$destination_count"
printf 'Moves:       %s uniquely checksum-matched path change(s)\n' "$move_count"

if [[ "$ambiguous_count" -gt 0 ]]; then
  printf 'Warning:     %s duplicate-checksum group(s) were ambiguous; their old R2 paths will be kept.\n' "$ambiguous_count" >&2
fi

while IFS= read -r -d '' old_path && IFS= read -r -d '' new_path; do
  printf '             %q -> %q\n' "$old_path" "$new_path"
done <"$move_plan"

rclone_args=(
  rclone
  copy
  "$source_root"
  "$DESTINATION"
  "${filter_args[@]}"
  --ignore-existing
  --verbose
  --progress
  --stats 15s
  --stats-one-line
)

printf 'Source:      %s\n' "$source_root"
printf 'Destination: %s\n' "$DESTINATION"
printf 'Files:       JPEG only; generated, hidden, metadata, and non-JPEG files excluded\n'

if [[ "$apply" == false ]]; then
  printf 'Mode:        dry run (no remote changes)\n'
  printf 'Note:        apply uploads new keys and relocates only the confirmed moves above.\n'
  printf '             Other existing objects stay unchanged.\n\n'
  rclone_args+=(--dry-run)
else
  printf 'Mode:        APPLY (new keys and confirmed moves only)\n'
  printf 'Type exactly "%s" to continue: ' "$APPLY_CONFIRMATION"
  IFS= read -r confirmation

  if [[ "$confirmation" != "$APPLY_CONFIRMATION" ]]; then
    printf 'Cancelled; no remote changes were made.\n'
    exit 1
  fi

  while IFS= read -r -d '' old_path && IFS= read -r -d '' new_path; do
    printf 'Moving R2 object: %q -> %q\n' "$old_path" "$new_path"
    if ! rclone moveto "$DESTINATION/$old_path" "$DESTINATION/$new_path" --immutable --verbose; then
      fail "could not safely relocate R2 object: $old_path"
    fi
  done <"$move_plan"
fi

if "${rclone_args[@]}"; then
  if [[ "$apply" == true ]]; then
    printf '\nArchive update completed successfully.\n'
  else
    printf '\nDry run completed successfully; no remote changes were made.\n'
  fi
else
  status=$?
  printf '\nrclone failed with exit status %s.\n' "$status" >&2
  exit "$status"
fi
