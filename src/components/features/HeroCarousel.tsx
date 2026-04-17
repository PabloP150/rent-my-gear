"use client";

import * as React from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GearImage } from "@/components/features/GearImage";
import { formatPrice } from "@/lib/date-utils";
import type { GearItem } from "@/lib/validation";

interface HeroCarouselProps {
  items: GearItem[];
}

export function HeroCarousel({ items }: HeroCarouselProps) {
  const [index, setIndex] = React.useState(0);

  React.useEffect(() => {
    if (items.length <= 1) return;
    const t = setInterval(() => setIndex((i) => (i + 1) % items.length), 5000);
    return () => clearInterval(t);
  }, [items.length]);

  if (items.length === 0) return null;
  const current = items[index];

  const prev = () => setIndex((i) => (i - 1 + items.length) % items.length);
  const next = () => setIndex((i) => (i + 1) % items.length);

  return (
    <section className="relative h-[440px] w-full overflow-hidden rounded-2xl bg-muted sm:h-[520px]">
      <div className="absolute inset-0">
        <GearImage item={current} priority sizes="100vw" />
      </div>
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
      <div className="relative flex h-full flex-col justify-end p-6 sm:p-10">
        <p className="text-xs uppercase tracking-widest text-white/80">Destacados</p>
        <h2 className="mt-2 max-w-2xl text-3xl font-semibold text-white sm:text-5xl">
          {current.name}
        </h2>
        <p className="mt-2 line-clamp-2 max-w-xl text-sm text-white/80 sm:text-base">
          {current.description}
        </p>
        <div className="mt-6 flex items-center gap-4">
          <Link href={`/gear/${current.id}`}>
            <Button size="lg">Rentar desde {formatPrice(current.dailyRate)}/día</Button>
          </Link>
          <div className="flex gap-2">
            <Button variant="outline" size="icon" onClick={prev} aria-label="Anterior">
              <ChevronLeft />
            </Button>
            <Button variant="outline" size="icon" onClick={next} aria-label="Siguiente">
              <ChevronRight />
            </Button>
          </div>
        </div>
      </div>
      <div className="absolute bottom-4 right-6 flex gap-1.5">
        {items.map((_, i) => (
          <button
            key={i}
            aria-label={`Ir al slide ${i + 1}`}
            onClick={() => setIndex(i)}
            className={`h-1.5 rounded-full transition-all ${
              i === index ? "w-8 bg-white" : "w-2 bg-white/50"
            }`}
          />
        ))}
      </div>
    </section>
  );
}
