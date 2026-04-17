import { Storage } from "@google-cloud/storage";
import { getEnv, isGcsConfigured } from "@/config/env";

let cachedStorage: Storage | null = null;

function getStorage(): Storage {
  if (cachedStorage) return cachedStorage;
  const env = getEnv();
  cachedStorage = new Storage({
    projectId: env.GCS_PROJECT_ID,
    keyFilename: env.GOOGLE_APPLICATION_CREDENTIALS,
  });
  return cachedStorage;
}

export async function uploadImage(
  objectName: string,
  data: Buffer,
  contentType: string
): Promise<string> {
  if (!isGcsConfigured()) {
    throw new Error("[storageService] GCS is not configured.");
  }
  const env = getEnv();
  const bucket = getStorage().bucket(env.GCS_BUCKET_NAME!);
  const file = bucket.file(objectName);
  await file.save(data, { contentType, resumable: false });
  return `https://storage.googleapis.com/${env.GCS_BUCKET_NAME}/${objectName}`;
}
