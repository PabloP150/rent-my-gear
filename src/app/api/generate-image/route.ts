import { NextRequest, NextResponse } from "next/server";
import { getGearById } from "@/services/inventoryService";
import { resolveImageUrl } from "@/services/imageService";
import { generateImageRequestSchema } from "@/lib/validation";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const gearId = searchParams.get("gearId");

  if (!gearId) {
    return NextResponse.json({ error: "Se requiere el parámetro gearId." }, { status: 400 });
  }

  const gear = getGearById(gearId);
  if (!gear) {
    return NextResponse.json({ error: "Equipo no encontrado." }, { status: 404 });
  }

  try {
    const imageURL = await resolveImageUrl(gear.id, gear.name);
    return NextResponse.json({ imageURL });
  } catch (err) {
    console.error("[GET /api/generate-image] Error:", err);
    return NextResponse.json(
      { error: "No se pudo generar la imagen. Intenta de nuevo." },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Cuerpo de la solicitud inválido." }, { status: 400 });
  }

  const result = generateImageRequestSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json(
      { error: result.error.issues[0].message },
      { status: 422 }
    );
  }

  const { gearId, gearName } = result.data;

  try {
    const imageURL = await resolveImageUrl(gearId, gearName);
    return NextResponse.json({ imageURL });
  } catch (err) {
    console.error("[POST /api/generate-image] Error:", err);
    return NextResponse.json(
      { error: "No se pudo generar la imagen. Intenta de nuevo." },
      { status: 500 }
    );
  }
}
