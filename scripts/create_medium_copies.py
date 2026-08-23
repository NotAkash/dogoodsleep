#!/usr/bin/env python3
"""Move large JPEG originals aside and replace them with web-sized copies.

Run from a photo folder:
    python3 create_medium_copies.py

Or supply the photo folder explicitly:
    python3 create_medium_copies.py /path/to/2026

Every processed directory receives a nested <folder-name>.large directory.
For example, /photos/2026/IMG_001.jpg is moved to
/photos/2026/2026.large/IMG_001.jpg and a medium JPEG is written at the
original path.
"""

from __future__ import annotations

import argparse
import os
import re
import shutil
import subprocess
import sys
import tempfile
from dataclasses import dataclass
from pathlib import Path
from typing import Iterator


MINIMUM_SOURCE_BYTES = 7 * 1024 * 1024  # 7 MiB
MAXIMUM_LONG_EDGE = 3200
JPEG_QUALITY = 92
JPEG_SUFFIXES = {".jpg", ".jpeg"}


@dataclass
class Summary:
    scanned: int = 0
    ineligible: int = 0
    moved: int = 0
    failed: int = 0


def parse_arguments() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description=(
            "Move JPEGs larger than 7 MiB into .large folders and replace them "
            "with 3200px-long-edge JPEGs at quality 92."
        )
    )
    parser.add_argument(
        "root_folder",
        nargs="?",
        type=Path,
        default=Path.cwd(),
        help="Folder to process recursively (default: the current directory)",
    )
    return parser.parse_args()


def is_generated_folder(path: Path) -> bool:
    name = path.name.lower()
    return name.endswith(".medium") or name.endswith(".large")


def iter_source_jpegs(root: Path) -> Iterator[Path]:
    """Yield regular source JPEGs while excluding generated image folders."""
    for directory, directory_names, file_names in os.walk(root, topdown=True, followlinks=False):
        current_directory = Path(directory)
        directory_names[:] = sorted(
            name
            for name in directory_names
            if not is_generated_folder(current_directory / name)
            and not (current_directory / name).is_symlink()
        )

        for file_name in sorted(file_names):
            source = current_directory / file_name
            if source.suffix.lower() not in JPEG_SUFFIXES:
                continue
            if source.is_file() and not source.is_symlink():
                yield source


def large_destination_for(source: Path) -> Path:
    destination_directory = source.parent / f"{source.parent.name}.large"
    return destination_directory / source.name


def image_dimensions(source: Path) -> tuple[int, int]:
    """Read JPEG dimensions through sips so no extra Python package is needed."""
    result = subprocess.run(
        ["sips", "--getProperty", "pixelWidth", "--getProperty", "pixelHeight", str(source)],
        check=False,
        capture_output=True,
        text=True,
    )
    if result.returncode != 0:
        raise RuntimeError(result.stderr.strip() or result.stdout.strip() or "sips could not read the image")

    width_match = re.search(r"pixelWidth:\s*(\d+)", result.stdout)
    height_match = re.search(r"pixelHeight:\s*(\d+)", result.stdout)
    if width_match is None or height_match is None:
        raise RuntimeError("sips did not report usable pixel dimensions")

    return int(width_match.group(1)), int(height_match.group(1))


def create_medium_staging_file(source: Path) -> Path:
    """Render a medium JPEG next to its source without changing that source."""
    source_stat = source.stat()
    width, height = image_dimensions(source)

    descriptor, temporary_name = tempfile.mkstemp(
        prefix=f".{source.stem}.",
        suffix=".jpg",
        dir=source.parent,
    )
    os.close(descriptor)
    temporary_destination = Path(temporary_name)

    try:
        command = [
            "sips",
            "--setProperty",
            "format",
            "jpeg",
            "--setProperty",
            "formatOptions",
            str(JPEG_QUALITY),
        ]
        if max(width, height) > MAXIMUM_LONG_EDGE:
            command.extend(["--resampleHeightWidthMax", str(MAXIMUM_LONG_EDGE)])
        command.extend([str(source), "--out", str(temporary_destination)])

        result = subprocess.run(command, check=False, capture_output=True, text=True)
        if result.returncode != 0:
            raise RuntimeError(result.stderr.strip() or result.stdout.strip() or "sips could not create the copy")
        if not temporary_destination.is_file() or temporary_destination.stat().st_size == 0:
            raise RuntimeError("sips did not create a usable JPEG copy")

        # Keep the replacement's timestamp meaningful without altering the original.
        os.utime(temporary_destination, ns=(source_stat.st_atime_ns, source_stat.st_mtime_ns))
        return temporary_destination
    except Exception:
        temporary_destination.unlink(missing_ok=True)
        raise


def move_original_and_replace_with_medium(source: Path) -> Path:
    """Move the original to .large only after a replacement has rendered safely."""
    large_destination = large_destination_for(source)
    if os.path.lexists(large_destination):
        raise FileExistsError(f"large-file destination already exists: {large_destination}")

    temporary_medium = create_medium_staging_file(source)
    try:
        # Recheck after rendering so the script never overwrites an existing original.
        if os.path.lexists(large_destination):
            raise FileExistsError(f"large-file destination already exists: {large_destination}")
        large_destination.parent.mkdir(parents=True, exist_ok=True)
        source.rename(large_destination)
        try:
            os.replace(temporary_medium, source)
        except OSError as replacement_error:
            try:
                large_destination.rename(source)
            except OSError as recovery_error:
                raise RuntimeError(
                    "could not place the medium replacement; the original remains at "
                    f"{large_destination} (automatic recovery failed: {recovery_error})"
                ) from replacement_error
            raise RuntimeError("could not place the medium replacement; the original was restored") from replacement_error
        return large_destination
    finally:
        temporary_medium.unlink(missing_ok=True)


def process(root: Path) -> Summary:
    summary = Summary()

    for source in iter_source_jpegs(root):
        summary.scanned += 1
        try:
            if source.stat().st_size <= MINIMUM_SOURCE_BYTES:
                summary.ineligible += 1
                continue

            large_destination = move_original_and_replace_with_medium(source)
            summary.moved += 1
            print(f"Moved original: {source} -> {large_destination}")
        except (OSError, RuntimeError, subprocess.SubprocessError) as error:
            summary.failed += 1
            print(f"Failed: {source}: {error}", file=sys.stderr)

    return summary


def print_summary(summary: Summary) -> None:
    print(
        "Finished: "
        f"{summary.scanned} JPEGs scanned; "
        f"{summary.ineligible} at or below 7 MiB; "
        f"{summary.moved} originals moved; "
        f"{summary.failed} failed."
    )


def main() -> int:
    arguments = parse_arguments()
    root = arguments.root_folder.expanduser().resolve()

    if not root.is_dir():
        print(f"Error: folder does not exist or is not a directory: {root}", file=sys.stderr)
        return 2
    if is_generated_folder(root):
        print("Error: choose a source folder, not a .medium or .large output folder.", file=sys.stderr)
        return 2
    if shutil.which("sips") is None:
        print("Error: this script requires macOS's built-in sips command.", file=sys.stderr)
        return 2

    summary = process(root)
    print_summary(summary)
    return 1 if summary.failed else 0


if __name__ == "__main__":
    raise SystemExit(main())
