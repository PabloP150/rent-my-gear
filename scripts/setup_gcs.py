"""
Configure the Google Cloud Storage bucket used to persist Nano Banana output.

Steps:
  1. Create the bucket if it does not exist.
  2. Grant public read access.
  3. Smoke test: upload → verify public URL → delete.

Usage:
    uv run setup_gcs.py
"""
from __future__ import annotations

import os
import sys
import uuid

import requests
from dotenv import load_dotenv
from google.cloud import storage
from google.cloud.exceptions import Conflict, NotFound


def require_env(name: str) -> str:
    value = os.environ.get(name)
    if not value:
        print(f"[setup_gcs] Missing required env var: {name}", file=sys.stderr)
        sys.exit(1)
    return value


def main() -> None:
    load_dotenv(dotenv_path="../.env.local")
    bucket_name = require_env("GCS_BUCKET_NAME")
    project_id = require_env("GCS_PROJECT_ID")

    client = storage.Client(project=project_id)

    try:
        bucket = client.create_bucket(bucket_name, location="US")
        print(f"[setup_gcs] Created bucket: {bucket.name}")
    except Conflict:
        bucket = client.bucket(bucket_name)
        print(f"[setup_gcs] Bucket already exists: {bucket.name}")

    try:
        policy = bucket.get_iam_policy(requested_policy_version=3)
        policy.bindings.append(
            {"role": "roles/storage.objectViewer", "members": {"allUsers"}}
        )
        bucket.set_iam_policy(policy)
        print("[setup_gcs] Granted public read access.")
    except Exception as exc:  # pragma: no cover
        print(f"[setup_gcs] Warning: could not set public policy ({exc}).")

    probe_name = f"smoke-test-{uuid.uuid4().hex}.txt"
    blob = bucket.blob(probe_name)
    blob.upload_from_string("rent-my-gear smoke test", content_type="text/plain")
    public_url = f"https://storage.googleapis.com/{bucket_name}/{probe_name}"
    print(f"[setup_gcs] Uploaded {probe_name}")

    response = requests.get(public_url, timeout=10)
    if response.status_code != 200:
        print(f"[setup_gcs] Smoke test FAILED (HTTP {response.status_code}).")
        sys.exit(1)
    print(f"[setup_gcs] Public URL reachable: {public_url}")

    try:
        blob.delete()
        print(f"[setup_gcs] Cleaned up {probe_name}")
    except NotFound:
        pass

    print("[setup_gcs] Bucket ready.")


if __name__ == "__main__":
    main()
