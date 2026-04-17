import { describe, it, expect, vi, beforeEach } from "vitest";

// Set env var before importing the service
process.env.NANO_BANANA_API_KEY = "test-key";

vi.mock("@/data/inventory.json", () => ({
  default: [
    { id: "fv-001", name: "Sony A7 IV", imageURL: "https://images.unsplash.com/photo-1" },
    { id: "da-011", name: "Garmin Descent Mk3i", imageURL: null },
  ],
}));

describe("imageService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns existing imageURL without calling Gemini", async () => {
    const { resolveImageUrl } = await import("./imageService");
    const fetchMock = vi.fn();
    global.fetch = fetchMock;

    const url = await resolveImageUrl("fv-001", "Sony A7 IV");
    expect(url).toBe("https://images.unsplash.com/photo-1");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("calls Gemini when imageURL is null and returns data URL", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        candidates: [{
          content: {
            parts: [{ inlineData: { data: "abc123", mimeType: "image/webp" } }],
          },
        }],
      }),
    });
    global.fetch = fetchMock;

    const { resolveImageUrl } = await import("./imageService");
    const url = await resolveImageUrl("da-011", "Garmin Descent Mk3i");
    expect(fetchMock).toHaveBeenCalledOnce();
    expect(url).toContain("data:image/webp;base64,");
  });

  it("throws when Gemini returns non-ok response", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      text: async () => "Internal Server Error",
    });
    global.fetch = fetchMock;

    const { resolveImageUrl } = await import("./imageService");
    await expect(resolveImageUrl("da-011", "Garmin Descent Mk3i")).rejects.toThrow("[Gemini]");
  });

  it("throws when Gemini response contains no image part", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        candidates: [{
          content: {
            parts: [{ text: "No image here, just text" }],
          },
        }],
      }),
    });
    global.fetch = fetchMock;

    const { resolveImageUrl } = await import("./imageService");
    await expect(resolveImageUrl("da-011", "Garmin Descent Mk3i")).rejects.toThrow(
      "[Gemini] Response did not contain an image."
    );
  });

  it("throws when NANO_BANANA_API_KEY is not set", async () => {
    vi.resetModules();
    const saved = process.env.NANO_BANANA_API_KEY;
    delete process.env.NANO_BANANA_API_KEY;

    vi.doMock("@/data/inventory.json", () => ({
      default: [{ id: "no-img", name: "No Image Gear", imageURL: null }],
    }));

    const { resolveImageUrl } = await import("./imageService");
    await expect(resolveImageUrl("no-img", "No Image Gear")).rejects.toThrow(
      "[imageService] NANO_BANANA_API_KEY is not set."
    );

    process.env.NANO_BANANA_API_KEY = saved;
    vi.resetModules();
  });
});
