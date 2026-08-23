#!/usr/bin/env bash

set -euo pipefail

readonly APPROVED_SOURCE_ROOT="/Volumes/LaCie/FinalEdits"
readonly RCLONE_REMOTE="placesyfaces:"
readonly DESTINATION="placesyfaces:placesyfaces"
readonly APPLY_CONFIRMATION="MIRROR /Volumes/LaCie/FinalEdits to placesyfaces:placesyfaces INCLUDING DELETIONS"

usage() {
  cat <<'USAGE'
Usage:
  scripts/sync-placesyfaces.sh /Volumes/LaCie/FinalEdits
  scripts/sync-placesyfaces.sh --apply /Volumes/LaCie/FinalEdits

The default mode is a non-mutating rclone dry run. Apply mode first repeats
that dry run, then requires an exact interactive confirmation. The eligible
JPEG objects in placesyfaces become a mirror of the approved source: new and
changed files are uploaded, uniquely checksum-matched moves are relocated,
and R2-only JPEGs are deleted after successful transfers.
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
  --filter "- **/[Tt][Hh][Uu][Mm][Bb][Ss]/**"
  --filter "- **/[Tt][Hh][Uu][Mm][Bb][Nn][Aa][Ii][Ll][Ss]/**"
  --filter "- **/*[._-][Tt][Hh][Uu][Mm][Bb].[Jj][Pp][Gg]"
  --filter "- **/*[._-][Tt][Hh][Uu][Mm][Bb].[Jj][Pp][Ee][Gg]"
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
update_plan="$work_dir/updates"

cleanup() {
  rm -f -- "$source_inventory" "$destination_inventory" "$move_plan" "$update_plan"
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

if ! plan_summary="$(python3 - "$source_inventory" "$destination_inventory" "$move_plan" "$update_plan" <<'PY'
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

updates = []
for object_path in sorted(set(source) & set(destination)):
    source_size, source_md5 = source[object_path]
    destination_size, destination_md5 = destination[object_path]
    sizes_differ = source_size != destination_size
    checksums_differ = bool(source_md5 and destination_md5 and source_md5 != destination_md5)
    if sizes_differ or checksums_differ:
        updates.append(object_path)

with open(sys.argv[4], "wb") as plan_file:
    for object_path in updates:
        plan_file.write(object_path.encode("utf-8") + b"\0")

addition_count = len(new_source) - len(moves)
removal_count = len(old_destination) - len(moves)

print(
    len(source),
    len(destination),
    addition_count,
    len(updates),
    len(moves),
    removal_count,
    ambiguous_groups,
)
PY
)"; then
  fail "could not compare source and destination inventories."
fi

read -r source_count destination_count addition_count update_count move_count removal_count ambiguous_count <<<"$plan_summary"

printf 'Inventory:   %s source JPEGs; %s destination JPEGs\n' "$source_count" "$destination_count"
printf 'Additions:   %s new path(s) not handled as moves\n' "$addition_count"
printf 'Updates:     %s checksum/size-changed existing path(s)\n' "$update_count"
printf 'Moves:       %s uniquely checksum-matched path change(s)\n' "$move_count"
printf 'Removals:    %s R2-only path(s) not handled as moves\n' "$removal_count"

if [[ "$ambiguous_count" -gt 0 ]]; then
  printf 'Note:        %s duplicate-checksum group(s) cannot use the move optimization; sync will transfer and remove them normally.\n' "$ambiguous_count" >&2
fi

while IFS= read -r -d '' old_path && IFS= read -r -d '' new_path; do
  printf '             %q -> %q\n' "$old_path" "$new_path"
done <"$move_plan"

sync_args=(
  rclone
  sync
  "$source_root"
  "$DESTINATION"
  "${filter_args[@]}"
  --check-first
  --delete-after
  --metadata
  --verbose
  --progress
  --stats 15s
  --stats-one-line
)

printf 'Source:      %s\n' "$source_root"
printf 'Destination: %s\n' "$DESTINATION"
printf 'Files:       JPEG only; generated, thumbnail, hidden, metadata, and non-JPEG files excluded\n'

if [[ "$apply" == false ]]; then
  printf 'Mode:        dry run (no remote changes)\n'
  printf 'Note:        apply makes eligible R2 JPEGs match the source, including updates and removals.\n\n'
else
  printf 'Mode:        APPLY requested; running the required dry run first.\n\n'
fi

if "${sync_args[@]}" --dry-run; then
  :
else
  status=$?
  printf '\nrclone dry run failed with exit status %s; no remote changes were made.\n' "$status" >&2
  exit "$status"
fi

if [[ "$apply" == false ]]; then
  printf '\nDry run completed successfully; no remote changes were made.\n'
  exit 0
else
  printf '\nDry run completed. Review the additions, updates, moves, and removals above.\n'
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

  while IFS= read -r -d '' object_path; do
    printf 'Updating changed R2 object: %q\n' "$object_path"
    if ! rclone copyto "$source_root/$object_path" "$DESTINATION/$object_path" --metadata --verbose; then
      fail "could not update changed R2 object: $object_path"
    fi
  done <"$update_plan"
fi

if "${sync_args[@]}"; then
  printf '\nArchive mirror completed successfully.\n'
else
  status=$?
  printf '\nrclone failed with exit status %s.\n' "$status" >&2
  exit "$status"
fi
