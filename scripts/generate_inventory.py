"""
Rebuilds src/data/inventory.json.

Production variant: search Unsplash for each generated item name and use the
first result as its imageURL. Requires UNSPLASH_ACCESS_KEY.

Dev variant (default): delegates to the Node script that seeds with stable
placeholder URLs. This keeps the build deterministic when Unsplash rate-limits.

Usage:
    uv run generate_inventory.py               # dev: delegates to Node
    UNSPLASH_ACCESS_KEY=... uv run generate_inventory.py --unsplash
"""
from __future__ import annotations

import argparse
import json
import os
import subprocess
import sys
from pathlib import Path

import requests
from dotenv import load_dotenv

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "src" / "data" / "inventory.json"
UNSPLASH_URL = "https://api.unsplash.com/search/photos"


def run_node_seed() -> None:
    script = ROOT / "scripts" / "build_inventory.mjs"
    subprocess.run(["node", str(script)], check=True)


def enrich_with_unsplash(access_key: str) -> None:
    with OUT.open("r", encoding="utf-8") as f:
        items = json.load(f)

    headers = {"Authorization": f"Client-ID {access_key}"}
    for item in items:
        if item.get("imageURL") is None:
            # Keep the 8 "missing" items so Nano Banana fallback still triggers.
            continue
        query = item["name"]
        response = requests.get(
            UNSPLASH_URL,
            params={"query": query, "per_page": 1, "orientation": "landscape"},
            headers=headers,
            timeout=15,
        )
        if response.status_code != 200:
            print(f"[generate_inventory] {item['id']}: Unsplash {response.status_code}")
            continue
        results = response.json().get("results", [])
        if not results:
            print(f"[generate_inventory] {item['id']}: no Unsplash hit for '{query}'")
            continue
        item["imageURL"] = results[0]["urls"]["regular"]
        print(f"[generate_inventory] {item['id']}: updated from Unsplash")

    with OUT.open("w", encoding="utf-8") as f:
        json.dump(items, f, ensure_ascii=False, indent=2)
        f.write("\n")


def main() -> None:
    load_dotenv(dotenv_path=ROOT / ".env.local")
    parser = argparse.ArgumentParser()
    parser.add_argument("--unsplash", action="store_true", help="Enrich with Unsplash image URLs")
    args = parser.parse_args()

    run_node_seed()

    if args.unsplash:
        access_key = os.environ.get("UNSPLASH_ACCESS_KEY")
        if not access_key:
            print("[generate_inventory] UNSPLASH_ACCESS_KEY is not set.", file=sys.stderr)
            sys.exit(1)
        enrich_with_unsplash(access_key)
        print(f"[generate_inventory] Wrote {OUT}")


if __name__ == "__main__":
    main()
