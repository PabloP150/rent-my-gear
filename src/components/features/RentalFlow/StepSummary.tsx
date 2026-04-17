"use client";

import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { calculatePrice, formatCurrency, formatDateEs } from "@/lib/date-utils";
import type { RentalState } from "./index";

interface StepSummaryProps {
  state: RentalState;
  onUpdate: (partial: Partial<RentalState>) => void;
  onNext: () => void;
  onBack: () => void;
}

export function StepSummary({ state, onUpdate, onNext, onBack }: StepSummaryProps) {
  const [name, setName] = useState(state.customerName);
  const [email, setEmail] = useState(state.customerEmail);
  const [errors, setErrors] = useState<{ name?: string; email?: string }>({});

  const breakdown =
    state.startDate && state.endDate
      ? calculatePrice(state.gear.dailyRate, { from: state.startDate, to: state.endDate }, state.gear.category)
      : null;

  function validate(): boolean {
    const e: typeof errors = {};
    if (!name.trim() || name.length < 2) e.name = "El nombre debe tener al menos 2 caracteres.";
    if (!email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) e.email = "Correo electrónico inválido.";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function handleNext() {
    if (!validate()) return;
    onUpdate({ customerName: name.trim(), customerEmail: email.trim() });
    onNext();
  }

  return (
    <Card>
      <CardContent className="p-6 space-y-6">
        <div>
          <h2 className="text-xl font-bold text-neutral-900">Resumen de renta</h2>
          <p className="text-sm text-neutral-500">Verifica los detalles antes de confirmar</p>
        </div>

        {/* Gear info */}
        <div className="rounded-xl bg-neutral-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-neutral-400">Equipo</p>
          <p className="mt-1 font-semibold text-neutral-900">{state.gear.name}</p>
        </div>

        {/* Date range */}
        {state.startDate && state.endDate && (
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-neutral-50 p-3">
              <p className="text-xs text-neutral-400">Inicio</p>
              <p className="font-medium">{formatDateEs(state.startDate)}</p>
            </div>
            <div className="rounded-xl bg-neutral-50 p-3">
              <p className="text-xs text-neutral-400">Fin</p>
              <p className="font-medium">{formatDateEs(state.endDate)}</p>
            </div>
          </div>
        )}

        {/* Price breakdown */}
        {breakdown && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-neutral-500">
                {formatCurrency(breakdown.dailyRate)} × {breakdown.days} día
                {breakdown.days !== 1 ? "s" : ""}
              </span>
              <span>{formatCurrency(breakdown.subtotal)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-neutral-500">
                Seguro Smart ({Math.round(breakdown.insuranceRate * 100)}%)
              </span>
              <span>{formatCurrency(breakdown.insurance)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-neutral-500">IVA (12%)</span>
              <span>{formatCurrency(breakdown.tax)}</span>
            </div>
            <Separator />
            <div className="flex justify-between font-bold text-lg">
              <span>Total</span>
              <span>{formatCurrency(breakdown.total)}</span>
            </div>
          </div>
        )}

        <Separator />

        {/* Customer info */}
        <div className="space-y-3">
          <h3 className="font-semibold text-neutral-900">Datos del cliente</h3>
          <div>
            <Input
              placeholder="Nombre completo"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name}</p>}
          </div>
          <div>
            <Input
              type="email"
              placeholder="Correo electrónico"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email}</p>}
          </div>
        </div>

        <div className="flex gap-3">
          <Button variant="outline" onClick={onBack} className="flex-1">
            Atrás
          </Button>
          <Button onClick={handleNext} className="flex-1">
            Revisar y confirmar
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
