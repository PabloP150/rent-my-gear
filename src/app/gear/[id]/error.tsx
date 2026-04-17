"use client";

import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function GearError({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="flex min-h-[40vh] flex-col items-center justify-center gap-4 text-center">
      <h2 className="text-xl font-bold text-neutral-900">Error al cargar el equipo</h2>
      <p className="text-neutral-500">No se pudo cargar la información. Intenta de nuevo.</p>
      <div className="flex gap-3">
        <Button onClick={reset}>Reintentar</Button>
        <Button variant="outline" asChild>
          <Link href="/">Inicio</Link>
        </Button>
      </div>
    </div>
  );
}
