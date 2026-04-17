"use client";

import React, { useState } from "react";
import type { DateRange } from "react-day-picker";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { formatDateEs, isAvailableDate } from "@/lib/date-utils";
import type { RentalState } from "./index";
import { CalendarDays } from "lucide-react";

interface StepConfigurationProps {
  state: RentalState;
  onUpdate: (partial: Partial<RentalState>) => void;
  onNext: () => void;
  onBack: () => void;
}

export function StepConfiguration({ state, onUpdate, onNext, onBack }: StepConfigurationProps) {
  const [range, setRange] = useState<DateRange | undefined>(
    state.startDate && state.endDate
      ? { from: state.startDate, to: state.endDate }
      : undefined
  );
  const [error, setError] = useState<string | null>(null);

  function handleSelect(selected: DateRange | undefined) {
    setError(null);
    setRange(selected);
  }

  function handleNext() {
    if (!range?.from || !range?.to) {
      setError("Por favor selecciona un rango de fechas.");
      return;
    }
    if (!isAvailableDate(range.from)) {
      setError("La fecha de inicio no puede ser en el pasado.");
      return;
    }
    onUpdate({ startDate: range.from, endDate: range.to });
    onNext();
  }

  const hasRange = range?.from && range?.to;

  return (
    <Card>
      <CardContent className="p-6 space-y-4">
        <div>
          <h2 className="text-xl font-bold text-neutral-900">Selecciona las fechas</h2>
          <p className="text-sm text-neutral-500">Elige el período en que necesitas el equipo</p>
        </div>

        <div className="flex justify-center">
          <Calendar
            mode="range"
            selected={range}
            onSelect={handleSelect}
            disabled={(date) => !isAvailableDate(date)}
            numberOfMonths={2}
          />
        </div>

        {hasRange && (
          <div className="flex items-center gap-3 rounded-xl bg-neutral-50 p-4">
            <CalendarDays className="h-5 w-5 text-neutral-400" />
            <div className="text-sm">
              <span className="font-medium">{formatDateEs(range.from!)}</span>
              <span className="text-neutral-400"> → </span>
              <span className="font-medium">{formatDateEs(range.to!)}</span>
            </div>
          </div>
        )}

        {error && (
          <p className="rounded-xl bg-red-50 px-4 py-2 text-sm text-red-600">{error}</p>
        )}

        <div className="flex gap-3">
          <Button variant="outline" onClick={onBack} className="flex-1">
            Atrás
          </Button>
          <Button onClick={handleNext} className="flex-1" disabled={!hasRange}>
            Continuar
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
