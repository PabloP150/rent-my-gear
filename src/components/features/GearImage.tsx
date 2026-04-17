"use client";

import React, { useState } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { Camera } from "lucide-react";

interface GearImageProps {
  src?: string | null;
  alt: string;
  gearId: string;
  className?: string;
  priority?: boolean;
}

export function GearImage({ src, alt, gearId, className, priority = false }: GearImageProps) {
  const [imgSrc, setImgSrc] = useState<string | null>(src ?? null);
  const [loading, setLoading] = useState(!src);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState(false);

  React.useEffect(() => {
    if (!src && !generating && !error) {
      setGenerating(true);
      setLoading(true);
      fetch(`/api/generate-image?gearId=${gearId}`)
        .then((r) => r.json())
        .then((data: { imageURL?: string }) => {
          if (data.imageURL) {
            setImgSrc(data.imageURL);
          } else {
            setError(true);
          }
        })
        .catch(() => setError(true))
        .finally(() => {
          setGenerating(false);
          setLoading(false);
        });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gearId, src]);

  if (error || (!imgSrc && !loading)) {
    return (
      <div
        className={cn(
          "flex items-center justify-center bg-neutral-100 text-neutral-400",
          className
        )}
      >
        <Camera className="h-12 w-12 opacity-30" />
      </div>
    );
  }

  if (loading || !imgSrc) {
    return (
      <div className={cn("animate-pulse bg-neutral-200", className)}>
        {generating && (
          <div className="flex h-full items-center justify-center">
            <span className="text-xs text-neutral-400">Generando imagen…</span>
          </div>
        )}
      </div>
    );
  }

  const isDataUrl = imgSrc.startsWith("data:");

  return (
    <div className={cn("relative overflow-hidden", className)}>
      {isDataUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={imgSrc}
          alt={alt}
          className="h-full w-full object-cover transition-transform duration-300 hover:scale-105"
          onError={() => setError(true)}
        />
      ) : (
        <Image
          src={imgSrc}
          alt={alt}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          className="object-cover transition-transform duration-300 hover:scale-105"
          priority={priority}
          onError={() => setError(true)}
        />
      )}
    </div>
  );
}
