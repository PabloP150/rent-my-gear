import { notFound } from "next/navigation";
import { GearImage } from "@/components/features/GearImage";
import { RentalFlow } from "@/components/features/RentalFlow/RentalFlow";
import { getGearById } from "@/services/inventoryService";
import { CATEGORIES, type CategoryId } from "@/lib/validation";
import { formatPrice } from "@/lib/date-utils";

export default async function GearPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const item = getGearById(id);
  if (!item) notFound();

  const category = CATEGORIES[item.category as CategoryId];

  return (
    <div className="grid gap-10 lg:grid-cols-[1.2fr_1fr]">
      <div className="space-y-6">
        <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-muted">
          <GearImage item={item} priority sizes="(max-width: 1024px) 100vw, 60vw" />
        </div>
        <div>
          <p className="text-sm text-muted-foreground">{category.name}</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight">{item.name}</h1>
          <p className="mt-3 text-2xl font-semibold">
            {formatPrice(item.dailyRate)}
            <span className="text-base font-normal text-muted-foreground">/día</span>
          </p>
          <p className="mt-4 text-sm text-muted-foreground">{item.description}</p>
        </div>
        <div>
          <h2 className="text-lg font-semibold">Especificaciones</h2>
          <dl className="mt-3 grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
            {Object.entries(item.specs).map(([k, v]) => (
              <div key={k} className="flex justify-between border-b py-2">
                <dt className="text-muted-foreground">{k}</dt>
                <dd className="font-medium">{v}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
      <div className="lg:sticky lg:top-6 lg:self-start">
        <RentalFlow item={item} />
      </div>
    </div>
  );
}
