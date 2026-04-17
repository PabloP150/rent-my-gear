"use client";

import React, { useState, useMemo, Suspense } from "react";
import Link from "next/link";
import { Search } from "lucide-react";
import { GearItem, CATEGORY_LABELS } from "@/lib/validation";
import { GearImage } from "./GearImage";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatCurrency } from "@/lib/date-utils";

interface GearGridProps {
  items: GearItem[];
  showSearch?: boolean;
}

function GearCardSkeleton() {
  return (
    <div className="rounded-2xl border border-neutral-200 bg-white">
      <div className="aspect-[4/3] animate-pulse rounded-t-2xl bg-neutral-200" />
      <div className="p-4 space-y-2">
        <div className="h-4 w-3/4 animate-pulse rounded bg-neutral-200" />
        <div className="h-3 w-1/2 animate-pulse rounded bg-neutral-200" />
        <div className="h-8 w-full animate-pulse rounded bg-neutral-200" />
      </div>
    </div>
  );
}

function GearCard({ item }: { item: GearItem }) {
  return (
    <Card className="group flex flex-col overflow-hidden">
      <div className="aspect-[4/3] overflow-hidden rounded-t-2xl">
        <GearImage
          src={item.imageURL}
          alt={item.name}
          gearId={item.id}
          className="h-full w-full"
        />
      </div>

      <CardContent className="flex flex-1 flex-col gap-2 pt-4">
        <Badge variant="secondary" className="w-fit">
          {CATEGORY_LABELS[item.category]}
        </Badge>
        <h3 className="font-semibold text-neutral-900 line-clamp-2 leading-snug">{item.name}</h3>
        <p className="text-sm text-neutral-500 line-clamp-2 flex-1">{item.description}</p>

        <div className="flex items-baseline gap-1">
          <span className="text-xl font-bold text-neutral-900">
            {formatCurrency(item.dailyRate)}
          </span>
          <span className="text-sm text-neutral-400">/ día</span>
        </div>

        {!item.available && (
          <Badge variant="destructive" className="w-fit">
            No disponible
          </Badge>
        )}
      </CardContent>

      <CardFooter>
        <Button asChild className="w-full" disabled={!item.available}>
          <Link href={`/gear/${item.id}`}>
            {item.available ? "Ver detalles" : "No disponible"}
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}

export function GearGrid({ items, showSearch = false }: GearGridProps) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    if (!query.trim()) return items;
    const lower = query.toLowerCase();
    return items.filter(
      (item) =>
        item.name.toLowerCase().includes(lower) ||
        item.description.toLowerCase().includes(lower)
    );
  }, [items, query]);

  return (
    <div className="space-y-6">
      {showSearch && (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
          <Input
            placeholder="Buscar equipos…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="py-16 text-center">
          <p className="text-neutral-400">No se encontraron equipos para &ldquo;{query}&rdquo;.</p>
        </div>
      ) : (
        <Suspense
          fallback={
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <GearCardSkeleton key={i} />
              ))}
            </div>
          }
        >
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filtered.map((item) => (
              <GearCard key={item.id} item={item} />
            ))}
          </div>
        </Suspense>
      )}

      <p className="text-sm text-neutral-400">
        {filtered.length} equipo{filtered.length !== 1 ? "s" : ""}
        {query ? ` para "${query}"` : ""}
      </p>
    </div>
  );
}
