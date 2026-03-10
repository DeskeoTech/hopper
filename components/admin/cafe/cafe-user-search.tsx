"use client"

import { useState, useEffect, useRef } from "react"
import { Search, User } from "lucide-react"
import { Input } from "@/components/ui/input"
import { searchCafeUsers, type CafeUserSearchResult } from "@/lib/actions/cafe"

interface CafeUserSearchProps {
  onSelect: (userId: string) => void
}

export function CafeUserSearch({ onSelect }: CafeUserSearchProps) {
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<CafeUserSearchResult[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout>>()
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)

    if (query.trim().length < 2) {
      setResults([])
      setIsOpen(false)
      return
    }

    debounceRef.current = setTimeout(async () => {
      setLoading(true)
      const { data } = await searchCafeUsers(query)
      setResults(data)
      setIsOpen(data.length > 0)
      setLoading(false)
    }, 300)

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [query])

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Rechercher par nom ou prénom..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="pl-9"
        />
      </div>

      {loading && (
        <p className="mt-2 text-center text-sm text-muted-foreground">Recherche...</p>
      )}

      {isOpen && results.length > 0 && (
        <div className="absolute z-50 mt-1 w-full rounded-lg border bg-background shadow-md">
          {results.map((user) => (
            <button
              key={user.id}
              onClick={() => {
                onSelect(user.id)
                setQuery("")
                setIsOpen(false)
              }}
              className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-muted/50 first:rounded-t-lg last:rounded-b-lg"
            >
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted">
                <User className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">
                  {user.first_name} {user.last_name}
                </p>
                {user.company_name && (
                  <p className="truncate text-xs text-muted-foreground">
                    {user.company_name}
                  </p>
                )}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
