"use client"

import { useState } from "react"
import { useLocale } from "next-intl"
import { useTransition } from "react"
import { setLocaleAction } from "@/lib/actions/locale"
import { ChevronDown } from "lucide-react"
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
            "flex items-center gap-1.5 rounded-full bg-[#D9CEC3] px-2 py-1.5 transition-opacity",
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
          <ChevronDown className={cn("h-3.5 w-3.5 text-[#8C8279] transition-transform", open && "rotate-180")} />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-auto rounded-2xl border-0 bg-[#D9CEC3] p-2 shadow-lg" align="start" sideOffset={8}>
        <div className="flex flex-col gap-1">
          {languages
            .filter((lang) => lang.code !== locale)
            .map((lang) => (
              <button
                key={lang.code}
                onClick={() => handleSelect(lang.code)}
                className="flex items-center gap-2.5 rounded-xl px-2.5 py-1.5 text-sm font-medium text-[#1B1918] transition-opacity hover:opacity-80"
              >
                <img
                  src={lang.flag}
                  alt={lang.label}
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
