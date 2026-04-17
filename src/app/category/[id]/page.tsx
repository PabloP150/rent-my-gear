import { notFound } from "next/navigation";
import { GearGrid } from "@/components/features/GearGrid";
import { getGearByCategory } from "@/services/inventoryService";
import { CATEGORIES, categorySchema } from "@/lib/validation";

export default async function CategoryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const parsed = categorySchema.safeParse(id);
  if (!parsed.success) notFound();
  const cat = CATEGORIES[parsed.data];
  const items = getGearByCategory(parsed.data);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">{cat.name}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{cat.description}</p>
      </div>
      <GearGrid items={items} />
    </div>
  );
}
