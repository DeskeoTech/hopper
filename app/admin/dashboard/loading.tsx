export default function DashboardLoading() {
  return (
    <div className="mx-auto max-w-[1325px] space-y-6 px-2 lg:px-3 animate-in fade-in duration-300">
      {/* Header skeleton */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:gap-4">
        <div className="h-10 w-10 shrink-0 rounded-sm bg-muted animate-pulse sm:h-14 sm:w-14" />
        <div className="space-y-2 flex-1">
          <div className="h-7 w-40 rounded-lg bg-muted animate-pulse" />
          <div className="h-4 w-64 rounded-lg bg-muted animate-pulse" />
        </div>
      </div>

      {/* KPIs skeleton */}
      <div className="grid grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-24 rounded-[20px] bg-muted animate-pulse" />
        ))}
      </div>

      {/* Occupation + Reservations skeleton */}
      <div className="grid gap-4 grid-cols-1 lg:grid-cols-5">
        <div className="lg:col-span-3 h-72 rounded-[20px] bg-muted animate-pulse" />
        <div className="lg:col-span-2 h-72 rounded-[20px] bg-muted animate-pulse" />
      </div>

      {/* Growth + Support skeleton */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
        <div className="h-56 rounded-[20px] bg-muted animate-pulse" />
        <div className="h-56 rounded-[20px] bg-muted animate-pulse" />
      </div>
    </div>
  )
}
