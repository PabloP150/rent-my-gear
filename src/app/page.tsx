import { getRandomGear } from "@/services/inventoryService";
import { HeroCarousel } from "@/components/features/HeroCarousel";
import { CategoryButtons } from "@/components/features/CategoryButtons";

export default function HomePage() {
  const featured = getRandomGear(5);

  return (
    <div className="space-y-12">
      <HeroCarousel items={featured} />
      <CategoryButtons />
    </div>
  );
}
