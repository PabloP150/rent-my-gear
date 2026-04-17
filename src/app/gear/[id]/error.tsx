"use client";

import { Button } from "@/components/ui/button";

export default function GearError({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="flex flex-col items-center gap-4 py-20 text-center">
      <h2 className="text-xl font-semibold">No pudimos cargar este equipo</h2>
      <Button onClick={reset}>Reintentar</Button>
    </div>
  );
}
