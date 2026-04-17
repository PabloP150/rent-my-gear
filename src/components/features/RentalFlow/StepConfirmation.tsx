"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { calculatePrice, formatCurrency, formatDateEs } from "@/lib/date-utils";
import { useToast } from "@/hooks/use-toast";
import type { RentalState } from "./index";
import { CheckCircle2, Loader2 } from "lucide-react";

interface StepConfirmationProps {
  state: RentalState;
}

type ConfirmationStatus = "pending" | "loading" | "confirmed";

export function StepConfirmation({ state }: StepConfirmationProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [status, setStatus] = useState<ConfirmationStatus>("pending");
  const [rentalId, setRentalId] = useState<string | null>(null);

  const breakdown =
    state.startDate && state.endDate
      ? calculatePrice(state.gear.dailyRate, { from: state.startDate, to: state.endDate }, state.gear.category)
      : null;

  async function handleConfirm() {
    if (!state.startDate || !state.endDate) return;
    setStatus("loading");

    try {
      const res = await fetch("/api/rental", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          gearId: state.gear.id,
          startDate: state.startDate.toISOString(),
          endDate: state.endDate.toISOString(),
          customerName: state.customerName,
          customerEmail: state.customerEmail,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error ?? "Error al confirmar la renta");
      }

      setRentalId(data.rentalId);
      setStatus("confirmed");
      toast({
        variant: "success",
        title: "¡Renta confirmada!",
        description: `Tu equipo estará listo para el ${formatDateEs(state.startDate)}.`,
      });
    } catch (err) {
      setStatus("pending");
      toast({
        variant: "destructive",
        title: "Error al confirmar",
        description: err instanceof Error ? err.message : "Intenta de nuevo.",
      });
    }
  }

  if (status === "confirmed") {
    return (
      <Card>
        <CardContent className="p-8 text-center space-y-4">
          <CheckCircle2 className="mx-auto h-16 w-16 text-green-500" />
          <h2 className="text-2xl font-bold text-neutral-900">¡Renta confirmada!</h2>
          <p className="text-neutral-500">
            Se ha enviado la confirmación a{" "}
            <span className="font-medium text-neutral-900">{state.customerEmail}</span>
          </p>
          {rentalId && (
            <div className="rounded-xl bg-neutral-50 p-4">
              <p className="text-xs text-neutral-400">ID de renta</p>
              <p className="font-mono font-medium text-neutral-900">{rentalId}</p>
            </div>
          )}
          <Button onClick={() => router.push("/")} className="w-full">
            Volver al inicio
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-6 space-y-6">
        <div>
          <h2 className="text-xl font-bold text-neutral-900">Confirmar renta</h2>
          <p className="text-sm text-neutral-500">Revisa los detalles finales</p>
        </div>

        <div className="rounded-xl bg-neutral-50 p-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-neutral-500">Equipo</span>
            <span className="font-medium">{state.gear.name}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-neutral-500">Cliente</span>
            <span className="font-medium">{state.customerName}</span>
          </div>
          {state.startDate && state.endDate && (
            <>
              <div className="flex justify-between text-sm">
                <span className="text-neutral-500">Inicio</span>
                <span className="font-medium">{formatDateEs(state.startDate)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-neutral-500">Fin</span>
                <span className="font-medium">{formatDateEs(state.endDate)}</span>
              </div>
            </>
          )}
        </div>

        {breakdown && (
          <>
            <Separator />
            <div className="space-y-1 text-sm">
              <div className="flex justify-between text-neutral-500">
                <span>Subtotal ({breakdown.days} día{breakdown.days !== 1 ? "s" : ""})</span>
                <span>{formatCurrency(breakdown.subtotal)}</span>
              </div>
              <div className="flex justify-between text-neutral-500">
                <span>Seguro Smart ({Math.round(breakdown.insuranceRate * 100)}%)</span>
                <span>{formatCurrency(breakdown.insurance)}</span>
              </div>
              <div className="flex justify-between text-neutral-500">
                <span>IVA (12%)</span>
                <span>{formatCurrency(breakdown.tax)}</span>
              </div>
            </div>
            <Separator />
            <div className="flex justify-between font-bold text-lg">
              <span>Total a pagar</span>
              <span>{formatCurrency(breakdown.total)}</span>
            </div>
          </>
        )}

        <Button
          onClick={handleConfirm}
          size="lg"
          className="w-full"
          disabled={status === "loading"}
        >
          {status === "loading" ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Procesando…
            </>
          ) : (
            "Confirmar Renta"
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
