import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { RentalFlow } from "./index";
import type { GearItem } from "@/lib/validation";

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }));
vi.mock("next/image", () => ({
  default: ({ alt }: { alt: string }) => <img alt={alt} />,
}));

const mockGear: GearItem = {
  id: "fv-001",
  name: "Sony A7 IV",
  category: "fotografia-video",
  description: "Cámara mirrorless de 33MP",
  dailyRate: 850,
  imageURL: "https://example.com/img.jpg",
  specs: { Sensor: "33MP", Video: "4K" },
  available: true,
};

describe("RentalFlow", () => {
  it("renders the selection step with gear info", () => {
    render(<RentalFlow gear={mockGear} />);
    expect(screen.getByText("Sony A7 IV")).toBeTruthy();
    expect(screen.getByText("Seleccionar fechas")).toBeTruthy();
  });

  it("shows step indicator with correct labels", () => {
    render(<RentalFlow gear={mockGear} />);
    expect(screen.getByText("Equipo")).toBeTruthy();
    expect(screen.getByText("Fechas")).toBeTruthy();
    expect(screen.getByText("Resumen")).toBeTruthy();
    expect(screen.getByText("Confirmación")).toBeTruthy();
  });

  it("navigates to configuration step on next click", () => {
    render(<RentalFlow gear={mockGear} />);
    fireEvent.click(screen.getByText("Seleccionar fechas"));
    expect(screen.getByText("Selecciona las fechas")).toBeTruthy();
  });

  it("shows back button on configuration step", () => {
    render(<RentalFlow gear={mockGear} />);
    fireEvent.click(screen.getByText("Seleccionar fechas"));
    expect(screen.getByText("Atrás")).toBeTruthy();
  });

  it("returns to selection on back from configuration", () => {
    render(<RentalFlow gear={mockGear} />);
    fireEvent.click(screen.getByText("Seleccionar fechas"));
    fireEvent.click(screen.getByText("Atrás"));
    expect(screen.getByText("Sony A7 IV")).toBeTruthy();
  });
});
