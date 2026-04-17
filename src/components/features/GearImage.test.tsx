import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { GearImage } from "./GearImage";

// GearImage uses Next.js <Image> for remote URLs; it's already mocked globally in setup.tsx
// to render a plain <img> tag, so onError fires normally in jsdom.

// ─── Unsplash URL present and loads fine ──────────────────────────────────────

describe("GearImage — valid imageURL (Unsplash path)", () => {
  it("renders an <img> with the provided src immediately", () => {
    render(
      <GearImage
        src="https://images.unsplash.com/photo-123"
        alt="Sony A7 IV"
        gearId="fv-001"
      />
    );
    const img = screen.getByAltText("Sony A7 IV") as HTMLImageElement;
    expect(img.src).toContain("images.unsplash.com");
  });

  it("does NOT call the generate-image API when src is provided", () => {
    const fetchMock = vi.fn();
    global.fetch = fetchMock;

    render(
      <GearImage
        src="https://images.unsplash.com/photo-123"
        alt="Camera"
        gearId="fv-001"
      />
    );

    expect(fetchMock).not.toHaveBeenCalled();
  });
});

// ─── Unsplash 404 — image load fails ─────────────────────────────────────────

describe("GearImage — Unsplash URL returns 404 (onError path)", () => {
  it("shows the camera placeholder when the image fails to load", () => {
    render(
      <GearImage
        src="https://images.unsplash.com/photo-broken"
        alt="Broken image"
        gearId="fv-002"
      />
    );

    const img = screen.getByAltText("Broken image");
    fireEvent.error(img);

    // Camera icon placeholder renders — no img in DOM for the error state
    expect(screen.queryByAltText("Broken image")).toBeNull();
    // The placeholder container is present (contains the Camera svg)
    expect(document.querySelector("svg")).toBeTruthy();
  });

  it("does NOT trigger the Nano Banana API when an existing URL fails to load", () => {
    const fetchMock = vi.fn();
    global.fetch = fetchMock;

    render(
      <GearImage
        src="https://images.unsplash.com/photo-broken"
        alt="Broken"
        gearId="fv-002"
      />
    );

    fireEvent.error(screen.getByAltText("Broken"));

    // No fetch call should have been made — GearImage does not auto-regenerate on load error
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

// ─── null imageURL — Nano Banana fallback ─────────────────────────────────────

describe("GearImage — null src triggers Nano Banana fallback (generate-image API)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows the loading skeleton while the API call is in-flight", () => {
    global.fetch = vi.fn().mockReturnValue(new Promise(() => {})); // never resolves

    render(<GearImage src={null} alt="Gear" gearId="da-011" />);

    // Loading state: animate-pulse skeleton should be present
    const skeleton = document.querySelector(".animate-pulse");
    expect(skeleton).toBeTruthy();
  });

  it("calls /api/generate-image with the correct gearId when src is null", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ imageURL: "data:image/webp;base64,ABC123" }),
    });
    global.fetch = fetchMock;

    render(<GearImage src={null} alt="Dive Watch" gearId="da-011" />);

    await waitFor(() =>
      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringContaining("/api/generate-image?gearId=da-011")
      )
    );
  });

  it("renders the generated data URL image after the API responds", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ imageURL: "data:image/webp;base64,ABC123" }),
    });

    render(<GearImage src={null} alt="Dive Watch" gearId="da-011" />);

    await waitFor(() => {
      const img = screen.getByAltText("Dive Watch") as HTMLImageElement;
      expect(img.src).toContain("data:image/webp;base64,ABC123");
    });
  });

  it("shows the camera placeholder when the generate-image API returns no imageURL", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ imageURL: undefined }),
    });

    render(<GearImage src={null} alt="Gear" gearId="da-012" />);

    await waitFor(() => expect(screen.queryByAltText("Gear")).toBeNull());
    expect(document.querySelector("svg")).toBeTruthy();
  });

  it("shows the camera placeholder when the generate-image API request fails (network error)", async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error("Network error"));

    render(<GearImage src={null} alt="Gear" gearId="da-013" />);

    await waitFor(() => expect(screen.queryByAltText("Gear")).toBeNull());
    expect(document.querySelector("svg")).toBeTruthy();
  });
});

// ─── data URL (already generated) ────────────────────────────────────────────

describe("GearImage — data URL (previously generated Nano Banana image)", () => {
  it("renders a plain <img> (not Next.js Image) for data URLs", () => {
    const dataUrl = "data:image/webp;base64,/9j/4AAQSkZJRgAB";
    render(<GearImage src={dataUrl} alt="Generated" gearId="mc-018" />);
    const img = screen.getByAltText("Generated") as HTMLImageElement;
    expect(img.src).toContain("data:image/webp;base64,");
  });

  it("does not call the generate-image API for data URLs", () => {
    const fetchMock = vi.fn();
    global.fetch = fetchMock;

    render(
      <GearImage src="data:image/webp;base64,ABC" alt="Generated" gearId="mc-018" />
    );

    expect(fetchMock).not.toHaveBeenCalled();
  });
});
