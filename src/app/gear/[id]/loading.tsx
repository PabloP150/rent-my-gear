export default function GearLoading() {
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="h-5 w-32 animate-pulse rounded bg-neutral-200" />
      <div className="rounded-2xl border border-neutral-200 bg-white overflow-hidden">
        <div className="aspect-video animate-pulse bg-neutral-200" />
        <div className="p-6 space-y-4">
          <div className="h-6 w-3/4 animate-pulse rounded bg-neutral-200" />
          <div className="h-4 w-full animate-pulse rounded bg-neutral-200" />
          <div className="h-10 w-full animate-pulse rounded bg-neutral-200" />
        </div>
      </div>
    </div>
  );
}
