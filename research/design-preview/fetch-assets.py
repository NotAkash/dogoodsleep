"""Restore the public media snapshots used by the isolated design preview."""

import json
from pathlib import Path
import subprocess
from urllib.parse import urlparse


root = Path(__file__).resolve().parent
assets = (root / "assets").resolve()
manifest = json.loads((root / "source-provenance.json").read_text())

for collection, source_key in (("photos", "src"), ("movies", "posterUrl")):
    for item in manifest[collection]:
        destination = (root / item["local"]).resolve()
        if assets not in destination.parents:
            raise ValueError("Preview assets must stay inside the assets directory")
        source = item[source_key]
        if urlparse(source).scheme != "https":
            raise ValueError("Preview assets require an HTTPS source")
        if destination.is_file():
            print("Already present:", destination.name)
            continue
        destination.parent.mkdir(parents=True, exist_ok=True)
        temporary = destination.with_suffix(destination.suffix + ".part")
        subprocess.run(
            ["curl", "--fail", "--location", "--silent", "--show-error",
             "--retry", "2", "--output", str(temporary), "--url", source],
            check=True,
        )
        temporary.replace(destination)
        print("Restored:", destination.name)
