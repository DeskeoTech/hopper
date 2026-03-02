export default function ClientsLoading() {
  return (
    <div className="mx-auto max-w-[1325px] space-y-6 px-2 lg:px-3 animate-in fade-in duration-300">
      {/* Header skeleton */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-7 w-36 rounded-lg bg-muted animate-pulse" />
          <div className="h-4 w-24 rounded-lg bg-muted animate-pulse" />
        </div>
        <div className="h-9 w-32 rounded-lg bg-muted animate-pulse" />
      </div>

      {/* Filters skeleton */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="h-10 w-full sm:flex-1 rounded-lg bg-muted animate-pulse" />
        <div className="h-10 w-full sm:w-40 rounded-lg bg-muted animate-pulse" />
        <div className="h-10 w-full sm:w-40 rounded-lg bg-muted animate-pulse" />
        <div className="h-10 w-full sm:w-48 rounded-lg bg-muted animate-pulse" />
      </div>

      {/* List skeleton */}
      <div className="rounded-[20px] bg-card divide-y divide-gray-100">
        {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
          <div key={i} className="flex items-center gap-4 px-5 py-4 sm:px-6">
            <div className="h-10 w-10 shrink-0 rounded-lg bg-muted animate-pulse" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-40 rounded bg-muted animate-pulse" />
              <div className="h-3 w-24 rounded bg-muted animate-pulse" />
            </div>
            <div className="hidden sm:block h-4 w-20 rounded bg-muted animate-pulse" />
            <div className="h-4 w-16 rounded bg-muted animate-pulse" />
          </div>
        ))}
      </div>
    </div>
  )
}
