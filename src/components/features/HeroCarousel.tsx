"use client";

import React, { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { GearItem } from "@/lib/validation";
import { GearImage } from "./GearImage";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/date-utils";
import { cn } from "@/lib/utils";
import { CATEGORY_LABELS } from "@/lib/validation";

interface HeroCarouselProps {
  items: GearItem[];
}

export function HeroCarousel({ items }: HeroCarouselProps) {
  const router = useRouter();
  const [current, setCurrent] = useState(Math.floor(Math.random() * items.length));
  const [animating, setAnimating] = useState(false);

  const go = useCallback(
    (next: number) => {
      if (animating) return;
      setAnimating(true);
      setTimeout(() => {
        setCurrent(((next % items.length) + items.length) % items.length);
        setAnimating(false);
      }, 200);
    },
    [animating, items.length]
  );

  useEffect(() => {
    const timer = setInterval(() => go(current + 1), 5000);
    return () => clearInterval(timer);
  }, [current, go]);

  if (!items.length) return null;

  const item = items[current];

  return (
    <section className="relative h-[520px] w-full overflow-hidden rounded-3xl bg-neutral-900 shadow-2xl">
      {/* Background image */}
      <GearImage
        src={item.imageURL}
        alt={item.name}
        gearId={item.id}
        className="absolute inset-0 h-full w-full opacity-60"
        priority
      />

      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-neutral-950/80 via-neutral-900/40 to-transparent" />

      {/* Content */}
      <div
        className={cn(
          "absolute inset-0 flex flex-col justify-end p-8 transition-opacity duration-200",
          animating ? "opacity-0" : "opacity-100"
        )}
      >
        <Badge variant="secondary" className="mb-3 w-fit">
          {CATEGORY_LABELS[item.category]}
        </Badge>
        <h2 className="mb-2 text-3xl font-bold text-white md:text-4xl">{item.name}</h2>
        <p className="mb-4 max-w-lg text-neutral-300 line-clamp-2">{item.description}</p>

        <div className="flex items-center gap-4">
          <span className="text-2xl font-semibold text-white">
            {formatCurrency(item.dailyRate)}
            <span className="text-sm font-normal text-neutral-400"> / día</span>
          </span>
          <Button
            onClick={() => router.push(`/gear/${item.id}`)}
            size="lg"
            className="bg-white text-neutral-900 hover:bg-neutral-100"
          >
            Rentar ahora
          </Button>
        </div>
      </div>

      {/* Navigation arrows */}
      <button
        onClick={() => go(current - 1)}
        className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full bg-white/20 p-2 text-white backdrop-blur-sm transition hover:bg-white/40"
        aria-label="Anterior"
      >
        <ChevronLeft className="h-5 w-5" />
      </button>
      <button
        onClick={() => go(current + 1)}
        className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-white/20 p-2 text-white backdrop-blur-sm transition hover:bg-white/40"
        aria-label="Siguiente"
      >
        <ChevronRight className="h-5 w-5" />
      </button>

      {/* Dots */}
      <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-1.5">
        {items.map((_, i) => (
          <button
            key={i}
            onClick={() => go(i)}
            className={cn(
              "h-1.5 rounded-full transition-all duration-300",
              i === current ? "w-6 bg-white" : "w-1.5 bg-white/40"
            )}
            aria-label={`Ir a diapositiva ${i + 1}`}
          />
        ))}
      </div>
    </section>
  );
}
