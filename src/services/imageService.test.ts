import { describe, it, expect, vi, beforeEach } from "vitest";

// Set env var before importing the service
process.env.NANO_BANANA_API_KEY = "test-key";

vi.mock("fs", () => ({
  default: {
    readFileSync: vi.fn().mockReturnValue(JSON.stringify([{ id: "fv-001", name: "Test Gear", imageURL: null }])),
    writeFileSync: vi.fn(),
  },
  readFileSync: vi.fn().mockReturnValue(JSON.stringify([{ id: "fv-001", name: "Test Gear", imageURL: null }])),
  writeFileSync: vi.fn(),
}));

// Inline mock for inventory data
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

  it("returns existing imageURL without calling NanoBanana", async () => {
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
    await expect(resolveImageUrl("da-011", "Garmin Descent Mk3i")).rejects.toThrow(
      "[Gemini]"
    );
  });
});
