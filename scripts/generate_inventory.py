"""
Inventory generator with Unsplash image lookup.

Searches Unsplash for each item name and uses the first result as imageURL.
Items matching ITEMS_WITHOUT_IMAGE are left without an imageURL to trigger
the Nano Banana fallback on first load.

Usage (from project root):
  uv run scripts/generate_inventory.py

Requires:
  - UNSPLASH_ACCESS_KEY in .env
"""

import json
import os
import sys
import time
from pathlib import Path

import requests
from dotenv import load_dotenv

load_dotenv()

INVENTORY_PATH = Path(__file__).parent.parent / "src" / "data" / "inventory.json"
UNSPLASH_API = "https://api.unsplash.com/search/photos"

# IDs of items that should NOT get an imageURL (will trigger Nano Banana fallback)
ITEMS_WITHOUT_IMAGE = {
    "da-011",
    "da-012",
    "da-013",
    "mc-018",
    "fv-018",
    "mc-019",
    "da-014",
    "da-015",
}


def search_unsplash(query: str, access_key: str) -> str | None:
    """Returns the first Unsplash photo URL for the query, or None."""
    try:
        resp = requests.get(
            UNSPLASH_API,
            params={"query": query, "per_page": 1, "orientation": "landscape"},
            headers={"Authorization": f"Client-ID {access_key}"},
            timeout=10,
        )
        resp.raise_for_status()
        results = resp.json().get("results", [])
        if results:
            return results[0]["urls"]["regular"] + "&w=800&auto=format&fit=crop"
    except Exception as e:
        print(f"  [WARN] Unsplash search failed for '{query}': {e}")
    return None


def main():
    access_key = os.getenv("UNSPLASH_ACCESS_KEY")
    if not access_key:
        print("[ERROR] UNSPLASH_ACCESS_KEY not set in .env")
        sys.exit(1)

    inventory: list[dict] = json.loads(INVENTORY_PATH.read_text())
    print(f"[INFO] Processing {len(inventory)} items...\n")

    updated = 0
    for item in inventory:
        item_id = item["id"]

        if item_id in ITEMS_WITHOUT_IMAGE:
            item["imageURL"] = None
            print(f"  [{item_id}] Skipped (no-image item)")
            continue

        if item.get("imageURL"):
            print(f"  [{item_id}] Already has imageURL, skipping")
            continue

        print(f"  [{item_id}] Searching Unsplash for: {item['name']}")
        url = search_unsplash(item["name"], access_key)
        if url:
            item["imageURL"] = url
            updated += 1
            print(f"           → {url[:70]}...")
        else:
            print(f"           → No result found")

        time.sleep(0.5)  # Respect Unsplash rate limits

    INVENTORY_PATH.write_text(json.dumps(inventory, indent=2, ensure_ascii=False))
    print(f"\n[DONE] Updated {updated} items. Inventory saved to {INVENTORY_PATH}")


if __name__ == "__main__":
    main()
