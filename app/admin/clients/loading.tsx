export default function ClientsLoading() {
  return (
    <div className="mx-auto max-w-[1325px] space-y-6 px-2 lg:px-3 animate-in fade-in duration-300">
      {/* Header skeleton */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:gap-4">
        <div className="h-10 w-10 shrink-0 rounded-sm bg-muted animate-pulse sm:h-14 sm:w-14" />
        <div className="space-y-2 flex-1">
          <div className="h-7 w-36 rounded-lg bg-muted animate-pulse" />
          <div className="h-4 w-48 rounded-lg bg-muted animate-pulse" />
        </div>
      </div>

      {/* Filters skeleton */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="h-10 w-full sm:w-64 rounded-lg bg-muted animate-pulse" />
        <div className="h-10 w-full sm:w-40 rounded-lg bg-muted animate-pulse" />
        <div className="h-10 w-full sm:w-40 rounded-lg bg-muted animate-pulse" />
      </div>

      {/* Table skeleton */}
      <div className="space-y-2">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="h-14 rounded-lg bg-muted animate-pulse" />
        ))}
      </div>
    </div>
  )
}
