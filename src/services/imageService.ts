import { getEnv, isGcsConfigured } from "@/config/env";
import { uploadImage } from "@/services/storageService";
import type { GearItem } from "@/lib/validation";

interface GeminiPart {
  inlineData?: { data: string; mimeType: string };
  text?: string;
}

interface GeminiResponse {
  candidates?: Array<{ content: { parts: GeminiPart[] } }>;
}

async function callNanoBanana(gearName: string): Promise<{ base64: string; mimeType: string }> {
  const { NANO_BANANA_API_KEY } = getEnv();
  const prompt = `Professional product photography of ${gearName} on a clean white background. High resolution, sharp focus, studio lighting, commercial quality.`;

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-preview-image-generation:generateContent?key=${NANO_BANANA_API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { responseModalities: ["IMAGE", "TEXT"] },
      }),
    }
  );

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`[Nano Banana] ${response.status}: ${body}`);
  }

  const data: GeminiResponse = await response.json();
  const part = data.candidates?.[0]?.content?.parts?.find((p) => p.inlineData);
  if (!part?.inlineData) throw new Error("[Nano Banana] No image in response.");
  return { base64: part.inlineData.data, mimeType: part.inlineData.mimeType };
}

export async function generateAndPersistImage(
  gearId: string,
  gearName: string
): Promise<string> {
  const { base64, mimeType } = await callNanoBanana(gearName);

  if (isGcsConfigured()) {
    const buffer = Buffer.from(base64, "base64");
    const ext = mimeType.split("/")[1] ?? "png";
    return uploadImage(`gear/${gearId}.${ext}`, buffer, mimeType);
  }

  return `data:${mimeType};base64,${base64}`;
}

export function resolveImageUrl(item: GearItem): string {
  if (item.imageURL) return item.imageURL;
  return `/api/generate-image?id=${item.id}&name=${encodeURIComponent(item.name)}`;
}

export async function isImageUrlValid(url: string): Promise<boolean> {
  try {
    const res = await fetch(url, { method: "HEAD" });
    return res.ok;
  } catch {
    return false;
  }
}
