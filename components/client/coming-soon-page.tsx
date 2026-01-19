"use client"

import { Clock } from "lucide-react"

interface ComingSoonPageProps {
  title: string
  description?: string
}

export function ComingSoonPage({ title, description }: ComingSoonPageProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
        <Clock className="h-8 w-8 text-muted-foreground" />
      </div>
      <h2 className="mt-6 type-h3 text-foreground">{title}</h2>
      <p className="mt-2 type-body text-muted-foreground text-center max-w-md">
        {description || "Cette fonctionnalité sera bientôt disponible."}
      </p>
    </div>
  )
}
