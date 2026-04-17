import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { GearImage } from "@/components/features/GearImage";
import { formatPrice } from "@/lib/date-utils";
import type { GearItem } from "@/lib/validation";

interface GearCardProps {
  item: GearItem;
}

export function GearCard({ item }: GearCardProps) {
  return (
    <Link href={`/gear/${item.id}`} className="group">
      <Card className="h-full overflow-hidden transition-all group-hover:border-primary group-hover:shadow-md">
        <div className="relative h-56 w-full bg-muted">
          <GearImage item={item} sizes="(max-width: 768px) 100vw, 33vw" />
          {!item.available && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50 text-sm font-medium text-white">
              No disponible
            </div>
          )}
        </div>
        <CardHeader>
          <CardTitle className="line-clamp-1">{item.name}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="line-clamp-2 text-sm text-muted-foreground">{item.description}</p>
          <p className="mt-4 text-lg font-semibold">{formatPrice(item.dailyRate)}<span className="text-sm font-normal text-muted-foreground">/día</span></p>
        </CardContent>
      </Card>
    </Link>
  );
}
