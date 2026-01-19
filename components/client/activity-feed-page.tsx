"use client"

import { Newspaper } from "lucide-react"

export function ActivityFeedPage() {
  return (
    <div className="flex flex-col items-center justify-center py-16">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
        <Newspaper className="h-8 w-8 text-muted-foreground" />
      </div>
      <h2 className="mt-6 type-h3 text-foreground">Fil d'actualité</h2>
      <p className="mt-2 type-body text-muted-foreground text-center max-w-md">
        Aucune actualité pour le moment.
      </p>
    </div>
  )
}
