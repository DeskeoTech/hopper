"use client"

import { useState } from "react"
import { ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"

interface CollapsibleSectionProps {
  title: string
  defaultOpen?: boolean
  children: React.ReactNode
  badge?: React.ReactNode
}

export function CollapsibleSection({
  title,
  defaultOpen = false,
  children,
  badge,
}: CollapsibleSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen)

  return (
    <section>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between py-2"
      >
        <div className="flex items-center gap-3">
          <h2 className="type-h3 text-foreground">{title}</h2>
          {badge}
        </div>
        <ChevronDown
          className={cn(
            "h-5 w-5 text-muted-foreground transition-transform duration-200",
            isOpen && "rotate-180"
          )}
        />
      </button>
      <div
        className={cn(
          "overflow-hidden transition-all duration-300",
          isOpen ? "max-h-[5000px] opacity-100 mt-4" : "max-h-0 opacity-0"
        )}
      >
        {children}
      </div>
    </section>
  )
}
