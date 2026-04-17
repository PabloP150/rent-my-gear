"use client";

import * as React from "react";
import { Check, ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import {
  calculateRentalPrice,
  formatDateRange,
  formatPrice,
  getMinSelectableDate,
} from "@/lib/date-utils";
import { toast } from "@/hooks/use-toast";
import type { GearItem } from "@/lib/validation";
import type { DateRange } from "react-day-picker";

type Step = "selection" | "configuration" | "summary" | "confirmation";

interface RentalFlowProps {
  item: GearItem;
}

export function RentalFlow({ item }: RentalFlowProps) {
  const [step, setStep] = React.useState<Step>("selection");
  const [range, setRange] = React.useState<DateRange | undefined>();
  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);

  const canConfirm =
    range?.from && range?.to && name.trim().length >= 2 && /.+@.+\..+/.test(email);

  async function submit() {
    if (!range?.from || !range?.to) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/rental", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          gearId: item.id,
          startDate: range.from.toISOString(),
          endDate: range.to.toISOString(),
          customerName: name,
          customerEmail: email,
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      toast({ title: "¡Renta confirmada!", description: "Recibirás un correo con los detalles." });
      setStep("confirmation");
    } catch (err) {
      toast({
        title: "Error al confirmar",
        description: err instanceof Error ? err.message : "Inténtalo de nuevo.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  }

  if (step === "selection") {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Selección</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Tarifa diaria: <span className="font-semibold text-foreground">{formatPrice(item.dailyRate)}</span>
          </p>
          <p className="text-sm">
            Estado:{" "}
            <span className={item.available ? "text-green-600" : "text-destructive"}>
              {item.available ? "Disponible" : "No disponible"}
            </span>
          </p>
          <Button
            size="lg"
            className="w-full"
            disabled={!item.available}
            onClick={() => setStep("configuration")}
          >
            Continuar a fechas
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (step === "configuration") {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Selección de Fechas</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Calendar
            mode="range"
            selected={range}
            onSelect={setRange}
            disabled={{ before: getMinSelectableDate() }}
            numberOfMonths={1}
          />
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setStep("selection")}>
              <ChevronLeft /> Atrás
            </Button>
            <Button
              className="flex-1"
              disabled={!range?.from || !range?.to}
              onClick={() => setStep("summary")}
            >
              Continuar
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (step === "summary" && range?.from && range?.to) {
    const price = calculateRentalPrice(item.dailyRate, range.from, range.to);
    return (
      <Card>
        <CardHeader>
          <CardTitle>Resumen</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg border p-4 text-sm">
            <p className="text-muted-foreground">Fechas</p>
            <p className="font-medium">{formatDateRange(range.from, range.to)}</p>
          </div>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted-foreground">
                {formatPrice(price.dailyRate)} x {price.days} {price.days === 1 ? "día" : "días"}
              </dt>
              <dd>{formatPrice(price.subtotal)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">IVA (12%)</dt>
              <dd>{formatPrice(price.tax)}</dd>
            </div>
            <div className="flex justify-between border-t pt-2 text-base font-semibold">
              <dt>Total</dt>
              <dd>{formatPrice(price.total)}</dd>
            </div>
          </dl>
          <div className="space-y-3 border-t pt-4">
            <div>
              <Label htmlFor="name">Nombre completo</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="email">Correo</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setStep("configuration")}>
              <ChevronLeft /> Atrás
            </Button>
            <Button className="flex-1" disabled={!canConfirm || submitting} onClick={submit}>
              {submitting ? "Procesando..." : "Confirmar Renta"}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="flex flex-col items-center gap-4 py-12 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100 text-green-600">
          <Check className="h-6 w-6" />
        </div>
        <h3 className="text-xl font-semibold">Renta Confirmada</h3>
        <p className="text-sm text-muted-foreground">
          Te enviamos los detalles a {email}.
        </p>
      </CardContent>
    </Card>
  );
}
