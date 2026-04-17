import inventoryData from "@/data/inventory.json";
import fs from "fs";
import path from "path";

const INVENTORY_PATH = path.join(process.cwd(), "src/data/inventory.json");

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
 * Persists a generated data URL back to inventory.json so subsequent server-side
 * calls skip regeneration. Data URLs are large; in production swap for GCS URL.
 */
function persistImageUrl(gearId: string, imageURL: string): void {
  // Skip persisting data URLs to avoid bloating inventory.json
  if (imageURL.startsWith("data:")) return;
  try {
    const inventory = JSON.parse(fs.readFileSync(INVENTORY_PATH, "utf-8"));
    const item = inventory.find((i: { id: string }) => i.id === gearId);
    if (item) {
      item.imageURL = imageURL;
      fs.writeFileSync(INVENTORY_PATH, JSON.stringify(inventory, null, 2));
    }
  } catch (err) {
    console.error("[imageService] Failed to persist imageURL to inventory.json:", err);
  }
}

/**
 * Resolves the image URL for a gear item.
 *
 * Strategy:
 *  1. If the item already has an imageURL, return it immediately.
 *  2. Otherwise, generate via Gemini and return a data URL.
 *     (Upgrade path: upload to GCS and persist the public URL instead.)
 */
export async function resolveImageUrl(gearId: string, gearName: string): Promise<string> {
  const item = (inventoryData as Array<{ id: string; imageURL?: string | null }>).find(
    (i) => i.id === gearId
  );

  if (item?.imageURL) {
    return item.imageURL;
  }

  console.log(`[imageService] No imageURL for "${gearName}" (${gearId}). Generating via Gemini...`);

  const dataUrl = await generateImageWithGemini(gearName);

  persistImageUrl(gearId, dataUrl);
  console.log(`[imageService] Generated image for: ${gearId}`);

  return dataUrl;
}
