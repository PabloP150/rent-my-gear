import { NextRequest, NextResponse } from "next/server";
import { rentalRequestRefinedSchema } from "@/lib/validation";
import { getGearById } from "@/services/inventoryService";
import { randomUUID } from "crypto";

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Cuerpo de la solicitud inválido." }, { status: 400 });
  }

  const result = rentalRequestRefinedSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json(
      { error: result.error.issues[0].message, details: result.error.issues },
      { status: 422 }
    );
  }

  const { gearId, startDate, endDate, customerName, customerEmail } = result.data;

  const gear = getGearById(gearId);
  if (!gear) {
    return NextResponse.json({ error: "Equipo no encontrado." }, { status: 404 });
  }
  if (!gear.available) {
    return NextResponse.json({ error: "El equipo no está disponible." }, { status: 409 });
  }

  // Mock rental confirmation — replace with database write in production
  const rentalId = `RMG-${randomUUID().slice(0, 8).toUpperCase()}`;

  console.log("[POST /api/rental] Created rental:", {
    rentalId,
    gearId,
    startDate,
    endDate,
    customerName,
    customerEmail,
  });

  return NextResponse.json(
    {
      rentalId,
      message: "Renta confirmada exitosamente.",
      gear: { id: gear.id, name: gear.name },
      startDate,
      endDate,
    },
    { status: 201 }
  );
}
