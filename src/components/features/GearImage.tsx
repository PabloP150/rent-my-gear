"use client";

import * as React from "react";
import Image from "next/image";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import type { GearItem } from "@/lib/validation";

interface GearImageProps {
  item: GearItem;
  className?: string;
  priority?: boolean;
  sizes?: string;
}

export function GearImage({ item, className, priority, sizes }: GearImageProps) {
  const [src, setSrc] = React.useState<string | null>(item.imageURL ?? null);
  const [loading, setLoading] = React.useState<boolean>(!item.imageURL);
  const [failed, setFailed] = React.useState(false);

  React.useEffect(() => {
    if (item.imageURL || failed) return;
    let alive = true;
    setLoading(true);
    fetch(`/api/generate-image?id=${item.id}&name=${encodeURIComponent(item.name)}`)
      .then((r) => (r.ok ? r.json() : Promise.reject(r.statusText)))
      .then((data: { url: string }) => {
        if (!alive) return;
        setSrc(data.url);
      })
      .catch(() => {
        if (alive) setFailed(true);
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [item.id, item.name, item.imageURL, failed]);

  if (loading) {
    return <Skeleton className={cn("h-full w-full", className)} />;
  }

  if (!src || failed) {
    return (
      <div
        className={cn(
          "flex h-full w-full items-center justify-center bg-muted text-xs text-muted-foreground",
          className
        )}
      >
        Sin imagen
      </div>
    );
  }

  return (
    <Image
      src={src}
      alt={item.name}
      fill
      priority={priority}
      sizes={sizes ?? "(max-width: 768px) 100vw, 33vw"}
      className={cn("object-cover", className)}
      unoptimized={src.startsWith("data:")}
    />
  );
}
