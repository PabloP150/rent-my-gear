"use client";

import React, { useState } from "react";
import { GearItem } from "@/lib/validation";
import { StepSelection } from "./StepSelection";
import { StepConfiguration } from "./StepConfiguration";
import { StepSummary } from "./StepSummary";
import { StepConfirmation } from "./StepConfirmation";
import { cn } from "@/lib/utils";

export type RentalStep = "selection" | "configuration" | "summary" | "confirmation";

export interface RentalState {
  gear: GearItem;
  startDate?: Date;
  endDate?: Date;
  customerName: string;
  customerEmail: string;
}

interface RentalFlowProps {
  gear: GearItem;
}

const STEPS: { id: RentalStep; label: string }[] = [
  { id: "selection", label: "Equipo" },
  { id: "configuration", label: "Fechas" },
  { id: "summary", label: "Resumen" },
  { id: "confirmation", label: "Confirmación" },
];

function StepIndicator({ current }: { current: RentalStep }) {
  const currentIndex = STEPS.findIndex((s) => s.id === current);
  return (
    <div className="flex items-center justify-center gap-0">
      {STEPS.map((step, i) => (
        <React.Fragment key={step.id}>
          <div className="flex flex-col items-center">
            <div
              className={cn(
                "flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium transition-all",
                i < currentIndex
                  ? "bg-neutral-900 text-white"
                  : i === currentIndex
                  ? "bg-neutral-900 text-white ring-4 ring-neutral-200"
                  : "bg-neutral-100 text-neutral-400"
              )}
            >
              {i < currentIndex ? "✓" : i + 1}
            </div>
            <span
              className={cn(
                "mt-1 text-xs",
                i === currentIndex ? "font-medium text-neutral-900" : "text-neutral-400"
              )}
            >
              {step.label}
            </span>
          </div>
          {i < STEPS.length - 1 && (
            <div
              className={cn(
                "mb-5 h-0.5 w-12 transition-all",
                i < currentIndex ? "bg-neutral-900" : "bg-neutral-200"
              )}
            />
          )}
        </React.Fragment>
      ))}
    </div>
  );
}

export function RentalFlow({ gear }: RentalFlowProps) {
  const [step, setStep] = useState<RentalStep>("selection");
  const [state, setState] = useState<RentalState>({
    gear,
    customerName: "",
    customerEmail: "",
  });

  const update = (partial: Partial<RentalState>) =>
    setState((prev) => ({ ...prev, ...partial }));

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <StepIndicator current={step} />

      {step === "selection" && (
        <StepSelection gear={gear} onNext={() => setStep("configuration")} />
      )}
      {step === "configuration" && (
        <StepConfiguration
          state={state}
          onUpdate={update}
          onNext={() => setStep("summary")}
          onBack={() => setStep("selection")}
        />
      )}
      {step === "summary" && (
        <StepSummary
          state={state}
          onUpdate={update}
          onNext={() => setStep("confirmation")}
          onBack={() => setStep("configuration")}
        />
      )}
      {step === "confirmation" && <StepConfirmation state={state} />}
    </div>
  );
}
