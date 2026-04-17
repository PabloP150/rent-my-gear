import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center gap-4 py-24 text-center">
      <h2 className="text-2xl font-semibold">Página no encontrada</h2>
      <p className="text-sm text-muted-foreground">El recurso que buscas no existe.</p>
      <Link href="/">
        <Button>Volver al inicio</Button>
      </Link>
    </div>
  );
}
