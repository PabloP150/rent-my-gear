import { Storage } from "@google-cloud/storage";
import { getEnv } from "@/config/env";

let _storage: Storage | null = null;

function requireGcsEnv() {
  const env = getEnv();
  if (!env.GCS_BUCKET_NAME || !env.GCS_PROJECT_ID || !env.GOOGLE_APPLICATION_CREDENTIALS) {
    throw new Error(
      "[storageService] GCS_BUCKET_NAME, GCS_PROJECT_ID, and GOOGLE_APPLICATION_CREDENTIALS are required for GCS operations."
    );
  }
  return env as Required<typeof env>;
}

function getStorage(): Storage {
  if (!_storage) {
    const env = requireGcsEnv();
    _storage = new Storage({
      projectId: env.GCS_PROJECT_ID,
      keyFilename: env.GOOGLE_APPLICATION_CREDENTIALS,
    });
  }
  return _storage;
}

/**
 * Uploads a base64-encoded image to GCS and returns the public URL.
 * The file is set as publicly readable.
 */
export async function uploadBase64Image(
  base64Data: string,
  fileName: string,
  contentType = "image/webp"
): Promise<string> {
  const env = requireGcsEnv();
  const storage = getStorage();
  const bucket = storage.bucket(env.GCS_BUCKET_NAME);
  const file = bucket.file(fileName);

  const buffer = Buffer.from(base64Data, "base64");

  await file.save(buffer, {
    metadata: { contentType },
    public: true,
    resumable: false,
  });

  return `https://storage.googleapis.com/${env.GCS_BUCKET_NAME}/${fileName}`;
}

/**
 * Checks whether a file exists in the bucket.
 */
export async function fileExists(fileName: string): Promise<boolean> {
  const env = requireGcsEnv();
  const storage = getStorage();
  const [exists] = await storage.bucket(env.GCS_BUCKET_NAME).file(fileName).exists();
  return exists;
}

/**
 * Deletes a file from the bucket. Used during GCS smoke-test and cleanup.
 */
export async function deleteFile(fileName: string): Promise<void> {
  const env = requireGcsEnv();
  const storage = getStorage();
  await storage.bucket(env.GCS_BUCKET_NAME).file(fileName).delete();
}
