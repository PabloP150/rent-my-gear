import { notFound } from "next/navigation";
import { getGearByCategory } from "@/services/inventoryService";
import { GearGrid } from "@/components/features/GearGrid";
import { categorySchema, CATEGORY_LABELS } from "@/lib/validation";

interface CategoryPageProps {
  params: Promise<{ id: string }>;
}

export function generateStaticParams() {
  return [
    { id: "fotografia-video" },
    { id: "montana-camping" },
    { id: "deportes-acuaticos" },
  ];
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { id } = await params;
  const result = categorySchema.safeParse(id);

  if (!result.success) notFound();

  const category = result.data;
  const items = getGearByCategory(category);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-neutral-900">{CATEGORY_LABELS[category]}</h1>
        <p className="mt-1 text-neutral-500">{items.length} equipos disponibles</p>
      </div>
      <GearGrid items={items} showSearch />
    </div>
  );
}
