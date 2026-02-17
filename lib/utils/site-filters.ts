import type { Site } from "@/lib/types/database"

interface SiteWithAddress {
  address: string
}

const IDF_CITIES = [
  "neuilly",
  "boulogne",
  "levallois",
  "issy",
  "puteaux",
  "courbevoie",
  "vincennes",
  "montreuil",
  "saint-denis",
  "nanterre",
]

export function filterByCity<T extends SiteWithAddress>(
  sites: T[],
  city: "paris" | "lyon" | null
): T[] {
  if (!city) return sites

  return sites.filter((site) => {
    const address = site.address.toLowerCase()

    if (city === "paris") {
      const parisRegex = /\b75\d{3}\b/
      const idfRegex = /\b(77|78|91|92|93|94|95)\d{3}\b/
      const isInIdf = IDF_CITIES.some((c) => address.includes(c))
      return parisRegex.test(address) || idfRegex.test(address) || address.includes("paris") || isInIdf
    }

    if (city === "lyon") {
      const lyonRegex = /\b69\d{3}\b/
      return lyonRegex.test(address) || address.includes("lyon")
    }

    return true
  })
}
