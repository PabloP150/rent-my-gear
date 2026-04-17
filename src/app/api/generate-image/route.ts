import { NextResponse } from "next/server";
import { generateAndPersistImage } from "@/services/imageService";
import { getGearById } from "@/services/inventoryService";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  const name = searchParams.get("name");

  if (!id) return NextResponse.json({ error: "Falta id" }, { status: 400 });

  const item = getGearById(id);
  if (item?.imageURL) return NextResponse.json({ url: item.imageURL });

  const gearName = item?.name ?? name;
  if (!gearName) return NextResponse.json({ error: "Falta name" }, { status: 400 });

  try {
    const url = await generateAndPersistImage(id, gearName);
    return NextResponse.json({ url });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Error generando imagen" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  if (!body?.gearId || !body?.gearName) {
    return NextResponse.json({ error: "gearId y gearName son requeridos" }, { status: 400 });
  }
  try {
    const url = await generateAndPersistImage(body.gearId, body.gearName);
    return NextResponse.json({ url });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Error generando imagen" },
      { status: 500 }
    );
  }
}
