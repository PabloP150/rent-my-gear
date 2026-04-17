"use client";

import React from "react";
import Link from "next/link";
import { Camera, Mountain, Waves } from "lucide-react";
import { cn } from "@/lib/utils";
import { Category, CATEGORY_LABELS } from "@/lib/validation";

interface CategoryConfig {
  id: Category;
  icon: React.ElementType;
  description: string;
  gradient: string;
  iconColor: string;
}

const CATEGORIES: CategoryConfig[] = [
  {
    id: "fotografia-video",
    icon: Camera,
    description: "Cámaras, lentes, drones y iluminación profesional",
    gradient: "from-violet-50 to-purple-50 hover:from-violet-100 hover:to-purple-100",
    iconColor: "text-violet-600 bg-violet-100",
  },
  {
    id: "montana-camping",
    icon: Mountain,
    description: "Mochilas, tiendas, cuerdas y equipo de alta montaña",
    gradient: "from-emerald-50 to-green-50 hover:from-emerald-100 hover:to-green-100",
    iconColor: "text-emerald-600 bg-emerald-100",
  },
  {
    id: "deportes-acuaticos",
    icon: Waves,
    description: "Equipo de buceo, kayaks, SUP y kitesurf",
    gradient: "from-sky-50 to-blue-50 hover:from-sky-100 hover:to-blue-100",
    iconColor: "text-sky-600 bg-sky-100",
  },
];

export function CategoryButtons() {
  return (
    <section>
      <h2 className="mb-6 text-2xl font-bold text-neutral-900">Explorar categorías</h2>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {CATEGORIES.map(({ id, icon: Icon, description, gradient, iconColor }) => (
          <Link
            key={id}
            href={`/category/${id}`}
            className={cn(
              "group flex items-start gap-4 rounded-2xl border border-transparent bg-gradient-to-br p-6 transition-all duration-200 hover:border-neutral-200 hover:shadow-md active:scale-[0.98]",
              gradient
            )}
          >
            <div className={cn("rounded-xl p-3", iconColor)}>
              <Icon className="h-6 w-6" />
            </div>
            <div>
              <h3 className="mb-1 font-semibold text-neutral-900">{CATEGORY_LABELS[id]}</h3>
              <p className="text-sm text-neutral-500">{description}</p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
