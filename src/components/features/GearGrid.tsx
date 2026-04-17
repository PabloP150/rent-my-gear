"use client";

import * as React from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { GearCard } from "@/components/features/GearCard";
import type { GearItem } from "@/lib/validation";

interface GearGridProps {
  items: GearItem[];
}

export function GearGrid({ items }: GearGridProps) {
  const [query, setQuery] = React.useState("");
  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter(
      (i) =>
        i.name.toLowerCase().includes(q) ||
        i.description.toLowerCase().includes(q)
    );
  }, [items, query]);

  return (
    <div className="space-y-6">
      <div className="relative max-w-md">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar equipo..."
          className="pl-9"
        />
      </div>
      {filtered.length === 0 ? (
        <p className="text-sm text-muted-foreground">Sin resultados para "{query}".</p>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((item) => (
            <GearCard key={item.id} item={item} />
          ))}
        </div>
      )}
    </div>
  );
}
