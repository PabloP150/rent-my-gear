import { notFound } from "next/navigation";
import { getGearById } from "@/services/inventoryService";
import { RentalFlow } from "@/components/features/RentalFlow";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { CATEGORY_LABELS } from "@/lib/validation";

interface GearPageProps {
  params: Promise<{ id: string }>;
}

export default async function GearPage({ params }: GearPageProps) {
  const { id } = await params;
  const gear = getGearById(id);

  if (!gear) notFound();

  return (
    <div className="space-y-6">
      <Link
        href={`/category/${gear.category}`}
        className="inline-flex items-center gap-1 text-sm text-neutral-500 hover:text-neutral-900 transition-colors"
      >
        <ChevronLeft className="h-4 w-4" />
        {CATEGORY_LABELS[gear.category]}
      </Link>

      <RentalFlow gear={gear} />
    </div>
  );
}
