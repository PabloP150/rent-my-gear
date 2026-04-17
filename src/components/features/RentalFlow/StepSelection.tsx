"use client";

import React from "react";
import { GearItem, CATEGORY_LABELS } from "@/lib/validation";
import { GearImage } from "../GearImage";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { formatCurrency } from "@/lib/date-utils";
import { CheckCircle } from "lucide-react";

interface StepSelectionProps {
  gear: GearItem;
  onNext: () => void;
}

export function StepSelection({ gear, onNext }: StepSelectionProps) {
  return (
    <Card>
      <CardContent className="p-0">
        <div className="aspect-[16/9] overflow-hidden rounded-t-2xl">
          <GearImage
            src={gear.imageURL}
            alt={gear.name}
            gearId={gear.id}
            className="h-full w-full"
            priority
          />
        </div>

        <div className="p-6 space-y-4">
          <div>
            <Badge className="mb-2">{CATEGORY_LABELS[gear.category]}</Badge>
            <h2 className="text-2xl font-bold text-neutral-900">{gear.name}</h2>
            <p className="mt-1 text-neutral-500">{gear.description}</p>
          </div>

          <Separator />

          <div>
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-neutral-400">
              Especificaciones
            </h3>
            <dl className="grid grid-cols-2 gap-3">
              {Object.entries(gear.specs).map(([key, value]) => (
                <div key={key} className="rounded-xl bg-neutral-50 p-3">
                  <dt className="text-xs text-neutral-400">{key}</dt>
                  <dd className="font-medium text-neutral-900">{value}</dd>
                </div>
              ))}
            </dl>
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-neutral-400">Tarifa diaria</p>
              <p className="text-3xl font-bold text-neutral-900">
                {formatCurrency(gear.dailyRate)}
              </p>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span className="text-green-700">Disponible</span>
            </div>
          </div>

          <Button onClick={onNext} size="lg" className="w-full">
            Seleccionar fechas
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
