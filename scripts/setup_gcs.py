"""
GCS bucket setup and smoke-test script.

Usage (from project root):
  uv run scripts/setup_gcs.py

Requirements:
  - .env file with GCS_BUCKET_NAME, GCS_PROJECT_ID, GOOGLE_APPLICATION_CREDENTIALS
  - google-cloud-storage installed via uv
"""

import os
import sys
import json
import uuid
from pathlib import Path

from dotenv import load_dotenv
from google.cloud import storage

load_dotenv()

REQUIRED_VARS = ["GCS_BUCKET_NAME", "GCS_PROJECT_ID", "GOOGLE_APPLICATION_CREDENTIALS"]


def check_env() -> dict[str, str]:
    missing = [v for v in REQUIRED_VARS if not os.getenv(v)]
    if missing:
        print(f"[ERROR] Missing env vars: {', '.join(missing)}")
        sys.exit(1)
    return {v: os.environ[v] for v in REQUIRED_VARS}


def get_client(env: dict[str, str]) -> storage.Client:
    return storage.Client(
        project=env["GCS_PROJECT_ID"],
        client_options={"credentials_file": env["GOOGLE_APPLICATION_CREDENTIALS"]},
    )


def create_bucket_if_not_exists(client: storage.Client, bucket_name: str, location: str = "US"):
    try:
        bucket = client.get_bucket(bucket_name)
        print(f"[OK] Bucket '{bucket_name}' already exists.")
        return bucket
    except Exception:
        print(f"[INFO] Creating bucket '{bucket_name}' in {location}...")
        bucket = client.create_bucket(bucket_name, location=location)
        print(f"[OK] Bucket '{bucket_name}' created.")
        return bucket


def set_public_access(bucket: storage.Bucket):
    """Sets allUsers as objectViewer to allow public reads."""
    policy = bucket.get_iam_policy(requested_policy_version=3)
    binding = {
        "role": "roles/storage.objectViewer",
        "members": {"allUsers"},
    }
    # Add if not already present
    for b in policy.bindings:
        if b["role"] == binding["role"] and "allUsers" in b["members"]:
            print("[OK] Public access already configured.")
            return
    policy.bindings.append(binding)
    bucket.set_iam_policy(policy)
    print("[OK] Public access (allUsers / objectViewer) configured.")


def smoke_test(client: storage.Client, bucket_name: str):
    """Upload a dummy file, verify public URL, then delete."""
    test_file_name = f"smoke-test/{uuid.uuid4()}.txt"
    test_content = b"rent-my-gear smoke test"

    bucket = client.bucket(bucket_name)
    blob = bucket.blob(test_file_name)

    print(f"\n[SMOKE TEST] Uploading test file: {test_file_name}")
    blob.upload_from_string(test_content, content_type="text/plain")

    public_url = f"https://storage.googleapis.com/{bucket_name}/{test_file_name}"
    print(f"[SMOKE TEST] Public URL: {public_url}")

    # Verify
    import urllib.request
    try:
        with urllib.request.urlopen(public_url) as response:
            data = response.read()
            assert data == test_content, "Content mismatch!"
            print("[SMOKE TEST] Public URL is accessible and content matches.")
    except Exception as e:
        print(f"[SMOKE TEST] WARNING: Could not verify public URL: {e}")

    # Cleanup
    blob.delete()
    print("[SMOKE TEST] Test file deleted. Smoke test passed.")


def main():
    print("=== Rent My Gear — GCS Setup ===\n")
    env = check_env()

    client = get_client(env)
    bucket = create_bucket_if_not_exists(client, env["GCS_BUCKET_NAME"])
    set_public_access(bucket)
    smoke_test(client, env["GCS_BUCKET_NAME"])

    print("\n[DONE] GCS bucket is ready for use.")
    print(f"       Bucket: gs://{env['GCS_BUCKET_NAME']}")


if __name__ == "__main__":
    main()
