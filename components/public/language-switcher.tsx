"use client"

import { useState } from "react"
import { useLocale } from "next-intl"
import { useTransition } from "react"
import { setLocaleAction } from "@/lib/actions/locale"
import { ChevronUp } from "lucide-react"
import { cn } from "@/lib/utils"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

const languages = [
  { code: "fr" as const, label: "Français", flag: "/flags/fr.svg" },
  { code: "en" as const, label: "English", flag: "/flags/gb.svg" },
]

export function LanguageSwitcher() {
  const locale = useLocale()
  const [isPending, startTransition] = useTransition()
  const [open, setOpen] = useState(false)

  const currentLang = languages.find((l) => l.code === locale) || languages[0]

  const handleSelect = (code: string) => {
    if (code === locale) {
      setOpen(false)
      return
    }
    setOpen(false)
    startTransition(async () => {
      await setLocaleAction(code)
    })
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          className={cn(
            "flex items-center gap-1.5 rounded-full bg-[#F2E7DC] px-2.5 py-2 transition-opacity",
            isPending && "opacity-50"
          )}
          disabled={isPending}
          suppressHydrationWarning
        >
          <img
            src={currentLang.flag}
            alt=""
            className="h-5 w-5 rounded-full object-cover"
          />
          <ChevronUp className="h-3.5 w-3.5 text-[#1B1918]" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-auto min-w-[140px] rounded-2xl p-2" align="start" sideOffset={8}>
        <div className="space-y-0.5">
          {languages.map((lang) => (
            <button
              key={lang.code}
              onClick={() => handleSelect(lang.code)}
              className={cn(
                "flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium transition-colors hover:bg-muted",
                locale === lang.code && "bg-[#F2E7DC]"
              )}
            >
              <img
                src={lang.flag}
                alt=""
                className="h-5 w-5 rounded-full object-cover"
              />
              <span>{lang.label}</span>
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  )
}
