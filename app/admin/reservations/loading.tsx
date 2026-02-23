export default function ReservationsLoading() {
  return (
    <div className="mx-auto max-w-[1325px] space-y-6 px-2 lg:px-3 animate-in fade-in duration-300">
      {/* Header skeleton */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:gap-4">
        <div className="h-10 w-10 shrink-0 rounded-sm bg-muted animate-pulse sm:h-14 sm:w-14" />
        <div className="space-y-2 flex-1">
          <div className="h-7 w-48 rounded-lg bg-muted animate-pulse" />
          <div className="h-4 w-56 rounded-lg bg-muted animate-pulse" />
        </div>
      </div>

      {/* Filters skeleton */}
      <div className="h-16 rounded-lg bg-muted animate-pulse" />

      {/* Count skeleton */}
      <div className="h-4 w-32 rounded-lg bg-muted animate-pulse" />

      {/* Calendar skeleton */}
      <div className="h-[500px] rounded-lg bg-muted animate-pulse" />
    </div>
  )
}
