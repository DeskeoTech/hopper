import { cn } from "@/lib/utils"
import type { TransportLine } from "@/lib/types/database"

// Official Paris metro and RER line colors
const TRANSPORT_LINE_COLORS: Record<string, { bg: string; text: string }> = {
  // Metro lines
  "1": { bg: "#FFCD00", text: "#000000" },
  "2": { bg: "#003CA6", text: "#FFFFFF" },
  "3": { bg: "#837902", text: "#FFFFFF" },
  "3bis": { bg: "#6EC4E8", text: "#000000" },
  "4": { bg: "#CF009E", text: "#FFFFFF" },
  "5": { bg: "#FF7E2E", text: "#000000" },
  "6": { bg: "#6ECA97", text: "#000000" },
  "7": { bg: "#FA9ABA", text: "#000000" },
  "7bis": { bg: "#6ECA97", text: "#000000" },
  "8": { bg: "#E19BDF", text: "#000000" },
  "9": { bg: "#B6BD00", text: "#000000" },
  "10": { bg: "#C9910D", text: "#FFFFFF" },
  "11": { bg: "#704B1C", text: "#FFFFFF" },
  "12": { bg: "#007852", text: "#FFFFFF" },
  "13": { bg: "#6EC4E8", text: "#000000" },
  "14": { bg: "#62259D", text: "#FFFFFF" },
  // RER lines
  "RER A": { bg: "#FF1400", text: "#FFFFFF" },
  "RER B": { bg: "#4C90CD", text: "#FFFFFF" },
  "RER C": { bg: "#F2D401", text: "#000000" },
  "RER D": { bg: "#00AB4E", text: "#FFFFFF" },
  "RER E": { bg: "#CD76A7", text: "#FFFFFF" },
}

// All available lines for selection
export const METRO_LINES = ["1", "2", "3", "3bis", "4", "5", "6", "7", "7bis", "8", "9", "10", "11", "12", "13", "14"] as const
export const RER_LINES = ["RER A", "RER B", "RER C", "RER D", "RER E"] as const
export const ALL_TRANSPORT_LINES = [...METRO_LINES, ...RER_LINES] as const

// Size classes hoisted outside component to avoid re-creation on each render
const SIZE_CLASSES = {
  sm: "h-5 min-w-[20px] text-[10px]",
  md: "h-6 min-w-[24px] text-xs",
  lg: "h-8 min-w-[32px] text-sm",
} as const

interface MetroLineBadgeProps {
  line: TransportLine | string
  size?: "sm" | "md" | "lg"
  className?: string
}

export function MetroLineBadge({ line, size = "md", className }: MetroLineBadgeProps) {
  const colors = TRANSPORT_LINE_COLORS[line]
  if (!colors) return null

  const isRER = line.startsWith("RER")
  const displayText = isRER ? line.replace("RER ", "") : line

  // RER badges are rectangular (rounded square), Metro badges are circular
  const shapeClasses = isRER
    ? "rounded px-1.5"
    : "rounded-full px-1"

  return (
    <span
      className={cn(
        "inline-flex items-center justify-center font-bold shrink-0",
        SIZE_CLASSES[size],
        shapeClasses,
        className
      )}
      style={{ backgroundColor: colors.bg, color: colors.text }}
      title={isRER ? `RER ${displayText}` : `Métro ligne ${line}`}
    >
      {displayText}
    </span>
  )
}

// Export colors for use in admin UI preview
export { TRANSPORT_LINE_COLORS }
