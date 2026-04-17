import { HeroCarousel } from "@/components/features/HeroCarousel";
import { CategoryButtons } from "@/components/features/CategoryButtons";
import { getRandomGear } from "@/services/inventoryService";

export default function Page() {
  const featured = getRandomGear(5);
  return (
    <div className="space-y-12">
      <HeroCarousel items={featured} />
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">Explora por categoría</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Equipo profesional listo para tu próxima aventura.
        </p>
        <div className="mt-6">
          <CategoryButtons />
        </div>
      </div>
    </div>
  );
}
