import { Skeleton } from "@/components/ui/skeleton";

export default function GearLoading() {
  return (
    <div className="grid gap-10 lg:grid-cols-[1.2fr_1fr]">
      <div className="space-y-6">
        <Skeleton className="aspect-[4/3] w-full rounded-2xl" />
        <Skeleton className="h-8 w-2/3" />
        <Skeleton className="h-24 w-full" />
      </div>
      <Skeleton className="h-80 rounded-xl" />
    </div>
  );
}
