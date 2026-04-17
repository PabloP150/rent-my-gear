import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import type { DateRange } from "react-day-picker";
import { RentalFlow } from "./index";
import { StepConfirmation } from "./StepConfirmation";
import type { RentalState } from "./index";
import type { GearItem } from "@/lib/validation";

// ─── Mocks ────────────────────────────────────────────────────────────────────

const mockToast = vi.fn();
vi.mock("@/hooks/use-toast", () => ({
  useToast: () => ({ toast: mockToast }),
}));

// Mock Calendar to expose a simple "select range" button, bypassing DayPicker internals
vi.mock("@/components/ui/calendar", () => ({
  Calendar: ({
    onSelect,
  }: {
    onSelect: (range: DateRange | undefined) => void;
    mode?: string;
    selected?: DateRange;
    disabled?: (d: Date) => boolean;
    numberOfMonths?: number;
  }) => (
    <button
      data-testid="mock-calendar"
      onClick={() =>
        onSelect({
          from: new Date("2026-06-01"),
          to: new Date("2026-06-07"),
        })
      }
    >
      Seleccionar rango de prueba
    </button>
  ),
}));

// ─── Shared fixtures ──────────────────────────────────────────────────────────

const makeGear = (overrides: Partial<GearItem> = {}): GearItem => ({
  id: "fv-001",
  name: "Sony A7 IV",
  category: "fotografia-video",
  description: "Cámara mirrorless de 33MP",
  dailyRate: 850,
  imageURL: "https://example.com/img.jpg",
  specs: { Sensor: "33MP", Video: "4K" },
  available: true,
  ...overrides,
});

const makeConfirmationState = (overrides: Partial<RentalState> = {}): RentalState => ({
  gear: makeGear(),
  startDate: new Date("2026-06-01"),
  endDate: new Date("2026-06-07"),
  customerName: "Ana García",
  customerEmail: "ana@example.com",
  ...overrides,
});

// ─── Wizard navigation ────────────────────────────────────────────────────────

describe("RentalFlow — wizard navigation", () => {
  it("starts on the selection step and shows gear name", () => {
    render(<RentalFlow gear={makeGear()} />);
    expect(screen.getByText("Sony A7 IV")).toBeTruthy();
    expect(screen.getByText("Seleccionar fechas")).toBeTruthy();
  });

  it("shows all four step labels in the indicator", () => {
    render(<RentalFlow gear={makeGear()} />);
    ["Equipo", "Fechas", "Resumen", "Confirmación"].forEach((label) =>
      expect(screen.getByText(label)).toBeTruthy()
    );
  });

  it("advances to the configuration step on 'Seleccionar fechas' click", () => {
    render(<RentalFlow gear={makeGear()} />);
    fireEvent.click(screen.getByText("Seleccionar fechas"));
    expect(screen.getByText("Selecciona las fechas")).toBeTruthy();
  });

  it("returns to selection from configuration via 'Atrás'", () => {
    render(<RentalFlow gear={makeGear()} />);
    fireEvent.click(screen.getByText("Seleccionar fechas"));
    fireEvent.click(screen.getByText("Atrás"));
    expect(screen.getByText("Sony A7 IV")).toBeTruthy();
  });

  it("advances from configuration to summary after selecting dates", () => {
    render(<RentalFlow gear={makeGear()} />);
    fireEvent.click(screen.getByText("Seleccionar fechas"));
    fireEvent.click(screen.getByTestId("mock-calendar"));
    fireEvent.click(screen.getByText("Continuar"));
    expect(screen.getByText("Resumen de renta")).toBeTruthy();
  });

  it("advances from summary to confirmation with valid customer data", () => {
    render(<RentalFlow gear={makeGear()} />);

    // Step 1 → 2
    fireEvent.click(screen.getByText("Seleccionar fechas"));
    // Step 2: select dates and continue
    fireEvent.click(screen.getByTestId("mock-calendar"));
    fireEvent.click(screen.getByText("Continuar"));

    // Step 3: fill customer info
    const nameInput = screen.getByPlaceholderText("Nombre completo");
    const emailInput = screen.getByPlaceholderText("Correo electrónico");
    fireEvent.change(nameInput, { target: { value: "Ana García" } });
    fireEvent.change(emailInput, { target: { value: "ana@example.com" } });
    fireEvent.click(screen.getByText("Revisar y confirmar"));

    // Step 4: confirmation screen
    expect(screen.getByText("Confirmar renta")).toBeTruthy();
    expect(screen.getByText("Confirmar Renta")).toBeTruthy();
  });

  it("shows validation errors in summary step for empty customer data", () => {
    render(<RentalFlow gear={makeGear()} />);
    fireEvent.click(screen.getByText("Seleccionar fechas"));
    fireEvent.click(screen.getByTestId("mock-calendar"));
    fireEvent.click(screen.getByText("Continuar"));
    // Click next without filling form
    fireEvent.click(screen.getByText("Revisar y confirmar"));
    expect(screen.getByText("El nombre debe tener al menos 2 caracteres.")).toBeTruthy();
  });
});

// ─── StepConfirmation — success path ─────────────────────────────────────────

describe("StepConfirmation — successful confirmation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        rentalId: "RMG-ABCD1234",
        message: "Renta confirmada exitosamente.",
      }),
    });
  });

  it("shows the rental summary before confirmation", () => {
    render(<StepConfirmation state={makeConfirmationState()} />);
    expect(screen.getByText("Confirmar renta")).toBeTruthy();
    expect(screen.getByText("Sony A7 IV")).toBeTruthy();
    expect(screen.getByText("Ana García")).toBeTruthy();
  });

  it("button is enabled when dates and customer data are present", () => {
    render(<StepConfirmation state={makeConfirmationState()} />);
    const btn = screen.getByRole("button", { name: "Confirmar Renta" });
    expect(btn).not.toBeDisabled();
  });

  it("shows loading spinner while fetch is in-flight", async () => {
    let resolve!: (v: unknown) => void;
    global.fetch = vi.fn().mockReturnValue(new Promise((r) => (resolve = r)));

    render(<StepConfirmation state={makeConfirmationState()} />);
    fireEvent.click(screen.getByRole("button", { name: "Confirmar Renta" }));

    expect(screen.getByText("Procesando…")).toBeTruthy();
    const btn = screen.getByRole("button", { name: /Procesando/ });
    expect(btn).toBeDisabled();

    // Clean up the pending promise
    await act(async () => {
      resolve({ ok: true, json: async () => ({ rentalId: "X" }) });
    });
  });

  it("transitions to confirmed view and displays rentalId on success", async () => {
    render(<StepConfirmation state={makeConfirmationState()} />);
    fireEvent.click(screen.getByRole("button", { name: "Confirmar Renta" }));

    await waitFor(() => expect(screen.getByText("¡Renta confirmada!")).toBeTruthy());
    expect(screen.getByText("RMG-ABCD1234")).toBeTruthy();
  });

  it("fires success toast with correct title after confirmation", async () => {
    render(<StepConfirmation state={makeConfirmationState()} />);
    fireEvent.click(screen.getByRole("button", { name: "Confirmar Renta" }));

    await waitFor(() =>
      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({ variant: "success", title: "¡Renta confirmada!" })
      )
    );
  });

  it("shows 'Volver al inicio' button after confirmation", async () => {
    render(<StepConfirmation state={makeConfirmationState()} />);
    fireEvent.click(screen.getByRole("button", { name: "Confirmar Renta" }));
    await waitFor(() => expect(screen.getByText("Volver al inicio")).toBeTruthy());
  });
});

// ─── StepConfirmation — error path ────────────────────────────────────────────

describe("StepConfirmation — API error handling", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows destructive toast and resets button on API error", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      json: async () => ({ error: "El equipo no está disponible." }),
    });

    render(<StepConfirmation state={makeConfirmationState()} />);
    fireEvent.click(screen.getByRole("button", { name: "Confirmar Renta" }));

    await waitFor(() =>
      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({ variant: "destructive", title: "Error al confirmar" })
      )
    );
    // Button resets to pending — user can retry
    expect(screen.getByRole("button", { name: "Confirmar Renta" })).not.toBeDisabled();
  });

  it("handles a network failure (fetch throws) gracefully", async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error("Network error"));

    render(<StepConfirmation state={makeConfirmationState()} />);
    fireEvent.click(screen.getByRole("button", { name: "Confirmar Renta" }));

    await waitFor(() =>
      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({ variant: "destructive" })
      )
    );
    expect(screen.getByRole("button", { name: "Confirmar Renta" })).toBeTruthy();
  });
});

// ─── StepConfirmation — all categories work ───────────────────────────────────

describe("StepConfirmation — category coverage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ rentalId: "RMG-TEST0001" }),
    });
  });

  it.each([
    ["fotografia-video" as const, "Sony A7 IV"],
    ["montana-camping" as const, "Black Diamond Spot 400"],
    ["deportes-acuaticos" as const, "Garmin Descent Mk3i"],
  ])("confirms rental for category '%s' without getting stuck", async (category, name) => {
    const state = makeConfirmationState({ gear: makeGear({ id: "test-id", name, category }) });
    render(<StepConfirmation state={state} />);
    fireEvent.click(screen.getByRole("button", { name: "Confirmar Renta" }));

    // Must transition to confirmed — button must NOT stay stuck in loading
    await waitFor(() => expect(screen.getByText("¡Renta confirmada!")).toBeTruthy(), {
      timeout: 3000,
    });
  });
});
