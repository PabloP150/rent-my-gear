import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 text-center">
      <h1 className="text-6xl font-bold text-neutral-200">404</h1>
      <h2 className="text-2xl font-bold text-neutral-900">Página no encontrada</h2>
      <p className="text-neutral-500">El recurso que buscas no existe.</p>
      <Button asChild>
        <Link href="/">Volver al inicio</Link>
      </Button>
    </div>
  );
}
