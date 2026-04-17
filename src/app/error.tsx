"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[GlobalError]", error);
  }, [error]);

  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 text-center">
      <h1 className="text-4xl font-bold text-neutral-900">Algo salió mal</h1>
      <p className="max-w-md text-neutral-500">{error.message}</p>
      {error.digest && (
        <p className="text-xs text-neutral-400">Referencia: {error.digest}</p>
      )}
      <Button onClick={reset}>Intentar de nuevo</Button>
    </div>
  );
}
