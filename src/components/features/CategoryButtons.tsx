import Link from "next/link";
import { Camera, Mountain, Waves } from "lucide-react";
import { CATEGORIES, type CategoryId } from "@/lib/validation";

const ICONS: Record<CategoryId, React.ComponentType<{ className?: string }>> = {
  "fotografia-video": Camera,
  "montana-camping": Mountain,
  "deportes-acuaticos": Waves,
};

export function CategoryButtons() {
  return (
    <section className="grid gap-4 sm:grid-cols-3">
      {(Object.keys(CATEGORIES) as CategoryId[]).map((id) => {
        const Icon = ICONS[id];
        const cat = CATEGORIES[id];
        return (
          <Link
            key={id}
            href={`/category/${id}`}
            className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border bg-card p-8 transition-all hover:border-primary hover:shadow-lg"
          >
            <Icon className="h-10 w-10 text-primary transition-transform group-hover:scale-110" />
            <div className="mt-8">
              <h3 className="text-2xl font-semibold">{cat.name}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{cat.description}</p>
            </div>
          </Link>
        );
      })}
    </section>
  );
}
