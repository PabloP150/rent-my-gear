import inventoryData from "@/data/inventory.json";
import type { GearItem } from "@/lib/validation";

const NANO_BANANA_API_KEY = process.env.NANO_BANANA_API_KEY;

interface GeminiResponse {
  candidates: Array<{
    content: {
      parts: Array<{ inlineData?: { data: string; mimeType: string }; text?: string }>;
    };
  }>;
}

/**
 * Calls Gemini directly to generate a product image.
 * Returns a data URL (base64) — no GCS required.
 */
async function generateImageWithGemini(gearName: string): Promise<string> {
  if (!NANO_BANANA_API_KEY) {
    throw new Error("[imageService] NANO_BANANA_API_KEY is not set.");
  }

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-preview-image-generation:generateContent?key=${NANO_BANANA_API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: `Professional product photography of ${gearName} on a clean white background. High resolution, sharp focus, studio lighting, commercial quality.`,
              },
            ],
          },
        ],
        generationConfig: { responseModalities: ["IMAGE", "TEXT"] },
      }),
    }
  );

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`[Gemini] Image generation failed (${response.status}): ${errorBody}`);
  }

  const data: GeminiResponse = await response.json();
  const imagePart = data.candidates?.[0]?.content?.parts?.find((p) => p.inlineData);

  if (!imagePart?.inlineData) {
    throw new Error("[Gemini] Response did not contain an image.");
  }

  const { data: base64, mimeType } = imagePart.inlineData;
  return `data:${mimeType};base64,${base64}`;
}

/**
 * Resolves the image URL for a gear item.
 *
 * Strategy:
 *  1. If the item already has an imageURL, return it immediately.
 *  2. Otherwise, generate via Gemini and return a data URL.
 *     (Upgrade path: upload to GCS and persist the public URL instead.)
 */
export async function resolveImageUrl(gearId: string, gearName: string): Promise<string>;
export function resolveImageUrl(item: GearItem): string;
export function resolveImageUrl(
  idOrItem: string | GearItem,
  gearName?: string
): string | Promise<string> {
  // Overload A: (item: GearItem) → sync string (reference-compatible)
  if (typeof idOrItem !== "string") {
    if (idOrItem.imageURL) return idOrItem.imageURL;
    return `/api/generate-image?id=${idOrItem.id}`;
  }

  // Overload B: (id, name) → async Promise<string> (legacy)
  const id = idOrItem;
  const name = gearName ?? id;
  const item = (inventoryData as Array<{ id: string; imageURL?: string | null }>).find(
    (i) => i.id === id
  );

  if (item?.imageURL) {
    return Promise.resolve(item.imageURL);
  }

  return (async () => {
    console.log(`[imageService] No imageURL for "${name}" (${id}). Generating via Gemini...`);
    const dataUrl = await generateImageWithGemini(name);
    console.log(`[imageService] Generated image for: ${id}`);
    return dataUrl;
  })();
}

/**
 * Checks if an image URL is reachable via HEAD request.
 * Used to detect broken Unsplash links before falling back to Nano Banana.
 */
export async function isImageUrlValid(url: string): Promise<boolean> {
  try {
    const response = await fetch(url, { method: "HEAD" });
    return response.ok;
  } catch {
    return false;
  }
}
