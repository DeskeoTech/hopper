export default function DashboardLoading() {
  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header + date nav skeleton */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-muted animate-pulse" />
          <div className="space-y-2">
            <div className="h-7 w-40 rounded-lg bg-muted animate-pulse" />
            <div className="h-4 w-56 rounded-lg bg-muted animate-pulse" />
          </div>
        </div>
        <div className="h-10 w-64 rounded-full bg-muted animate-pulse" />
      </div>

      {/* Tabs skeleton */}
      <div className="flex gap-2">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-9 w-28 rounded-full bg-muted animate-pulse" />
        ))}
      </div>

      {/* Period selector skeleton */}
      <div className="flex gap-2">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="h-8 w-20 rounded-full bg-muted animate-pulse" />
        ))}
      </div>

      {/* Main CA card skeleton */}
      <div className="rounded-[20px] bg-card p-5 sm:p-6 space-y-3">
        <div className="flex items-center gap-3">
          <div className="h-5 w-5 rounded bg-muted animate-pulse" />
          <div className="h-4 w-48 rounded bg-muted animate-pulse" />
        </div>
        <div className="h-10 w-40 rounded-lg bg-muted animate-pulse" />
        <div className="h-4 w-72 rounded bg-muted animate-pulse" />
      </div>

      {/* Product cards skeleton */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="rounded-[20px] bg-card p-5 space-y-3">
            <div className="h-4 w-32 rounded bg-muted animate-pulse" />
            <div className="h-8 w-28 rounded-lg bg-muted animate-pulse" />
            <div className="h-3 w-48 rounded bg-muted animate-pulse" />
          </div>
        ))}
      </div>

      {/* Chart skeleton */}
      <div className="rounded-[20px] bg-card p-5 space-y-4">
        <div className="h-5 w-32 rounded bg-muted animate-pulse" />
        <div className="h-[200px] rounded-lg bg-muted animate-pulse" />
      </div>
    </div>
  )
}
