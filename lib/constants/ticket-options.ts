import type { TicketRequestType } from "@/lib/types/database"

/** Maps legacy slug keys to display labels (used for backward compat with old data) */
export const REQUEST_TYPE_LABELS: Record<TicketRequestType, string> = {
  administratif: "Administratif",
  ascenseurs: "Ascenseurs",
  audiovisuel: "Audiovisuel",
  autre: "Autre",
  badges: "Badges",
  cafe_the: "Café & Thé",
  catering: "Catering",
  chauffage: "Chauffage",
  climatisation: "Climatisation",
  code_acces: "Code d'accès",
  electricite: "Électricité",
  electromenager: "Électroménager",
  espaces_verts: "Espaces verts",
  fenetres: "Fenêtres",
  finance: "Finance",
  fontaine_eau: "Fontaine à eau",
  immeuble: "Immeuble",
  imprimantes: "Imprimantes",
  internet_reseau: "Internet & Réseau",
  interphone: "Interphone",
  isolation_phonique: "Isolation phonique",
  juridique: "Juridique",
  menage: "Ménage",
  mobilier: "Mobilier",
  nuisances: "Nuisances",
  nuisibles: "Nuisibles",
  plomberie: "Plomberie",
  portes: "Portes",
  ssi: "SSI",
  telephone_gsm: "Téléphone & GSM",
  videosurveillance_alarme: "Vidéosurveillance & Alarme",
}

/** Labels excluded from new ticket creation (kept in REQUEST_TYPE_LABELS for backward compat) */
const DEPRECATED_REQUEST_TYPES = new Set(["Administratif"])

export const REQUEST_TYPE_OPTIONS = Object.values(REQUEST_TYPE_LABELS)
  .filter((label) => !DEPRECATED_REQUEST_TYPES.has(label))
  .map((label) => ({
    value: label,
    label,
  }))

export const REQUEST_SUBTYPE_OPTIONS: Record<string, { value: string; label: string }[]> = {
  "Ascenseurs": [
    { value: "Demande de renseignements", label: "Demande de renseignements" },
    { value: "Panne ou dysfonctionnement", label: "Panne ou dysfonctionnement" },
  ],
  "Audiovisuel": [
    { value: "Demande de renseignements", label: "Demande de renseignements" },
    { value: "Panne ou dysfonctionnement", label: "Panne ou dysfonctionnement" },
  ],
  "Badges": [
    { value: "Demande de renseignements", label: "Demande de renseignements" },
  ],
  "Café & Thé": [
    { value: "Demande de renseignements", label: "Demande de renseignements" },
    { value: "Panne ou dysfonctionnement", label: "Panne ou dysfonctionnement" },
    { value: "Augmentation, Suspension ou Réduction des quantités", label: "Augmentation, Suspension ou Réduction des quantités" },
    { value: "Insatisfaction", label: "Insatisfaction" },
  ],
  "Catering": [
    { value: "Livraison snacks, fruits, etc.", label: "Livraison snacks, fruits, etc." },
    { value: "Petit-déjeuner", label: "Petit-déjeuner" },
  ],
  "Chauffage": [
    { value: "Demande de renseignements", label: "Demande de renseignements" },
    { value: "Panne ou dysfonctionnement", label: "Panne ou dysfonctionnement" },
  ],
  "Climatisation": [
    { value: "Demande de renseignements", label: "Demande de renseignements" },
    { value: "Panne ou dysfonctionnement", label: "Panne ou dysfonctionnement" },
  ],
  "Code d'accès": [
    { value: "Demande de renseignements", label: "Demande de renseignements" },
    { value: "Panne ou dysfonctionnement", label: "Panne ou dysfonctionnement" },
  ],
  "Électroménager": [
    { value: "Demande de renseignements", label: "Demande de renseignements" },
    { value: "Panne ou dysfonctionnement", label: "Panne ou dysfonctionnement" },
  ],
  "Électricité": [
    { value: "Demande de renseignements", label: "Demande de renseignements" },
    { value: "Panne ou dysfonctionnement", label: "Panne ou dysfonctionnement" },
  ],
  "Espaces verts": [
    { value: "Demande de renseignements", label: "Demande de renseignements" },
    { value: "Demande de plantes supplémentaires", label: "Demande de plantes supplémentaires" },
    { value: "Insatisfaction", label: "Insatisfaction" },
  ],
  "Finance": [
    { value: "Problème ou demande facture", label: "Problème ou demande facture" },
    { value: "Problème prélèvement ou Recouvrement client", label: "Problème prélèvement ou Recouvrement client" },
  ],
  "Fontaine à eau": [
    { value: "Demande de renseignements", label: "Demande de renseignements" },
    { value: "Insatisfaction (goût, pétillant, etc.)", label: "Insatisfaction (goût, pétillant, etc.)" },
    { value: "Demande de livraison CO₂", label: "Demande de livraison CO₂" },
    { value: "Panne ou dysfonctionnement", label: "Panne ou dysfonctionnement" },
  ],
  "Fenêtres": [
    { value: "Demande de renseignements", label: "Demande de renseignements" },
    { value: "Panne ou dysfonctionnement", label: "Panne ou dysfonctionnement" },
  ],
  "Isolation phonique": [
    { value: "Demande de renseignements", label: "Demande de renseignements" },
  ],
  "Immeuble": [
    { value: "Demande de renseignements", label: "Demande de renseignements" },
  ],
  "Juridique": [
    { value: "État des lieux", label: "État des lieux" },
    { value: "Préavis", label: "Préavis" },
  ],
  "Mobilier": [
    { value: "Demande de renseignements", label: "Demande de renseignements" },
    { value: "Panne ou dysfonctionnement", label: "Panne ou dysfonctionnement" },
  ],
  "Ménage": [
    { value: "Demande de renseignements", label: "Demande de renseignements" },
    { value: "Ménage supplémentaire ponctuel", label: "Ménage supplémentaire ponctuel" },
    { value: "Ménage supplémentaire récurrent", label: "Ménage supplémentaire récurrent" },
    { value: "Insatisfaction", label: "Insatisfaction" },
  ],
  "Nuisances": [
    { value: "Mauvaises odeurs", label: "Mauvaises odeurs" },
    { value: "Nuisances lumineuses", label: "Nuisances lumineuses" },
    { value: "Nuisances sonores", label: "Nuisances sonores" },
  ],
  "Nuisibles": [
    { value: "Vermines", label: "Vermines" },
    { value: "Mouches & Moucherons", label: "Mouches & Moucherons" },
  ],
  "Plomberie": [
    { value: "Fuite ou infiltration", label: "Fuite ou infiltration" },
    { value: "Panne ou dysfonctionnement", label: "Panne ou dysfonctionnement" },
  ],
  "Portes": [
    { value: "Demande de renseignements", label: "Demande de renseignements" },
    { value: "Panne ou dysfonctionnement", label: "Panne ou dysfonctionnement" },
    { value: "Porte parking bloquée/cassée", label: "Porte parking bloquée/cassée" },
  ],
  "SSI": [
    { value: "Demande de renseignements", label: "Demande de renseignements" },
    { value: "Panne ou dysfonctionnement", label: "Panne ou dysfonctionnement" },
  ],
  "Imprimantes": [
    { value: "Demande de renseignements", label: "Demande de renseignements" },
    { value: "Panne ou dysfonctionnement", label: "Panne ou dysfonctionnement" },
  ],
  "Internet & Réseau": [
    { value: "Demande de renseignements", label: "Demande de renseignements" },
    { value: "Panne ou dysfonctionnement", label: "Panne ou dysfonctionnement" },
  ],
  "Interphone": [
    { value: "Demande de renseignements", label: "Demande de renseignements" },
    { value: "Panne ou dysfonctionnement", label: "Panne ou dysfonctionnement" },
  ],
  "Téléphone & GSM": [
    { value: "Demande de renseignements", label: "Demande de renseignements" },
    { value: "Panne ou dysfonctionnement", label: "Panne ou dysfonctionnement" },
  ],
  "Vidéosurveillance & Alarme": [
    { value: "Panne ou dysfonctionnement", label: "Panne ou dysfonctionnement" },
    { value: "Demande de renseignements", label: "Demande de renseignements" },
    { value: "Cambriolage - demande rapport client", label: "Cambriolage - demande rapport client" },
  ],
}

/** Get the display label for a request type (handles both legacy slugs and new labels) */
export function getRequestTypeLabel(type: string | null): string {
  if (!type) return "-"
  // Try legacy slug lookup first, then return as-is (new label format)
  return REQUEST_TYPE_LABELS[type as TicketRequestType] || type
}

/** Get the display label for a subtype value (handles both legacy slugs and new labels) */
export function getSubtypeLabel(requestType: string | null, subtypeValue: string | null): string | null {
  if (!requestType || !subtypeValue) return null
  // Resolve request type: try legacy slug → label, or use as-is
  const labelKey = REQUEST_TYPE_LABELS[requestType as TicketRequestType] || requestType
  const options = REQUEST_SUBTYPE_OPTIONS[labelKey]
  if (!options) return subtypeValue
  const found = options.find((o) => o.value === subtypeValue)
  return found?.label || subtypeValue
}
