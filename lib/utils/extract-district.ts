export function extractDistrict(address: string, locale: string): string {
  const parisMatch = address.match(/75(\d{3})/)
  if (parisMatch) {
    const arr = parseInt(parisMatch[1], 10)
    if (arr === 1) return locale === "en" ? "Paris 1st" : "Paris 1er"
    return locale === "en" ? `Paris ${arr}th` : `Paris ${arr}ème`
  }

  const lyonMatch = address.match(/69(\d{3})/)
  if (lyonMatch) {
    const arr = parseInt(lyonMatch[1], 10)
    if (arr <= 9) {
      if (arr === 1) return locale === "en" ? "Lyon 1st" : "Lyon 1er"
      return locale === "en" ? `Lyon ${arr}th` : `Lyon ${arr}ème`
    }
  }

  const addressLower = address.toLowerCase()
  if (addressLower.includes("neuilly")) return "Neuilly-sur-Seine"
  if (addressLower.includes("boulogne")) return "Boulogne-Billancourt"
  if (addressLower.includes("levallois")) return "Levallois-Perret"
  if (addressLower.includes("issy")) return "Issy-les-Moulineaux"

  const parts = address.split(",")
  if (parts.length >= 2) {
    const cityPart = parts[parts.length - 1].trim()
    return cityPart.replace(/\d{5}\s*/, "").trim() || "Île-de-France"
  }

  return "Île-de-France"
}
