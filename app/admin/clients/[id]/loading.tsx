export default function CompanyDetailLoading() {
  return (
    <div className="mx-auto max-w-[1325px] space-y-6 px-2 lg:px-3 animate-in fade-in duration-300">
      {/* Back link skeleton */}
      <div className="h-4 w-32 rounded-lg bg-muted animate-pulse" />

      {/* Header skeleton */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:gap-4">
        <div className="h-10 w-10 shrink-0 rounded-sm bg-muted animate-pulse sm:h-14 sm:w-14" />
        <div className="space-y-2 flex-1">
          <div className="h-7 w-48 rounded-lg bg-muted animate-pulse" />
          <div className="h-4 w-64 rounded-lg bg-muted animate-pulse" />
        </div>
      </div>

      {/* Tabs skeleton */}
      <div className="flex gap-4 border-b border-border pb-2">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-8 w-24 rounded-lg bg-muted animate-pulse" />
        ))}
      </div>

      {/* Content skeleton */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
          <div className="h-48 rounded-[20px] bg-muted animate-pulse" />
          <div className="h-64 rounded-[20px] bg-muted animate-pulse" />
        </div>
        <div className="space-y-4">
          <div className="h-40 rounded-[20px] bg-muted animate-pulse" />
          <div className="h-32 rounded-[20px] bg-muted animate-pulse" />
        </div>
      </div>
    </div>
  )
}
