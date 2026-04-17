import { NextResponse } from "next/server";
import { rentalRequestSchema } from "@/lib/validation";
import { getGearById } from "@/services/inventoryService";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = rentalRequestSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Datos inválidos", issues: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const gear = getGearById(parsed.data.gearId);
  if (!gear) {
    return NextResponse.json({ error: "Equipo no encontrado" }, { status: 404 });
  }
  if (!gear.available) {
    return NextResponse.json({ error: "Equipo no disponible" }, { status: 409 });
  }

  return NextResponse.json({
    ok: true,
    rentalId: `mock-${Date.now()}`,
    ...parsed.data,
  });
}
