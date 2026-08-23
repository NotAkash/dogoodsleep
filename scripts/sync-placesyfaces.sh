#!/usr/bin/env bash

set -euo pipefail

readonly APPROVED_SOURCE_ROOT="/Volumes/LaCie/FinalEdits"
readonly RCLONE_REMOTE="placesyfaces:"
readonly DESTINATION="placesyfaces:placesyfaces"
readonly APPLY_CONFIRMATION="UPLOAD NEW FILES to placesyfaces:placesyfaces"

usage() {
  cat <<'USAGE'
Usage:
  scripts/sync-placesyfaces.sh /Volumes/LaCie/FinalEdits
  scripts/sync-placesyfaces.sh --apply /Volumes/LaCie/FinalEdits

The default mode is a non-mutating rclone dry run. Apply mode requires both
the --apply flag and an interactive confirmation. It uploads new object keys
only; existing destination objects are never replaced or deleted.
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

source_input="$1"

command -v rclone >/dev/null 2>&1 || fail "rclone is not installed or is not on PATH."
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

rclone_args=(
  rclone
  copy
  "$source_root"
  "$DESTINATION"
  --filter "- *.large/**"
  --filter "- *.medium/**"
  --filter "- .*/**"
  --filter "- ._*"
  --filter "+ **/"
  --filter "+ *.{{(?i)jpe?g}}"
  --filter "- **"
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
  printf 'Note:        apply mode uploads new keys only; existing objects stay unchanged.\n\n'
  rclone_args+=(--dry-run)
else
  [[ -t 0 ]] || fail "apply mode requires an interactive terminal."

  printf 'Mode:        APPLY (new object keys only; existing objects remain unchanged)\n'
  printf 'Type exactly "%s" to continue: ' "$APPLY_CONFIRMATION"
  IFS= read -r confirmation

  if [[ "$confirmation" != "$APPLY_CONFIRMATION" ]]; then
    printf 'Cancelled; no remote changes were made.\n'
    exit 1
  fi
fi

if "${rclone_args[@]}"; then
  if [[ "$apply" == true ]]; then
    printf '\nAppend-only upload completed successfully.\n'
  else
    printf '\nDry run completed successfully; no remote changes were made.\n'
  fi
else
  status=$?
  printf '\nrclone failed with exit status %s.\n' "$status" >&2
  exit "$status"
fi
