import type { TicketRequestType } from "@/lib/types/database"

/** Maps legacy slug keys to display labels (used for backward compat with old data) */
export const REQUEST_TYPE_LABELS: Record<TicketRequestType, string> = {
  administratif: "Administratif",
  ascenseurs: "Ascenseurs",
  audiovisuel: "Audiovisuel",
  autre: "Autre",
  badges: "Badges",
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
  internet_reseau: "Internet / Réseau",
  interphone: "Interphone",
  isolation_phonique: "Isolation phonique",
  juridique: "Juridique",
  menage: "Ménage",
  nuisances: "Nuisances",
  nuisibles: "Nuisibles",
  plomberie: "Plomberie",
  portes: "Portes",
  ssi: "SSI",
  videosurveillance_alarme: "Vidéosurveillance / Alarme",
}

export const REQUEST_TYPE_OPTIONS = Object.values(REQUEST_TYPE_LABELS).map((label) => ({
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
  "Administratif": [
    { value: "Demande relative aux crédits", label: "Demande relative aux crédits" },
    { value: "Question sur l'abonnement café", label: "Question sur l'abonnement café" },
    { value: "Envoi/Question sur préavis", label: "Envoi/Question sur préavis" },
    { value: "Demande d'information contractuelle", label: "Demande d'information contractuelle" },
  ],
  "Badges": [
    { value: "Demande de renseignements", label: "Demande de renseignements" },
  ],
  "Catering": [
    { value: "Petit-déjeuner", label: "Petit-déjeuner" },
    { value: "Livraison snacks, fruits, etc.", label: "Livraison snacks, fruits, etc." },
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
  "Électricité": [
    { value: "Demande de renseignements", label: "Demande de renseignements" },
    { value: "Panne ou dysfonctionnement", label: "Panne ou dysfonctionnement" },
  ],
  "Électroménager": [
    { value: "Demande de renseignements", label: "Demande de renseignements" },
    { value: "Panne ou dysfonctionnement", label: "Panne ou dysfonctionnement" },
  ],
  "Espaces verts": [
    { value: "Insatisfaction", label: "Insatisfaction" },
  ],
  "Fenêtres": [
    { value: "Demande de renseignements", label: "Demande de renseignements" },
    { value: "Panne ou dysfonctionnement", label: "Panne ou dysfonctionnement" },
  ],
  "Finance": [
    { value: "Problème prélèvement ou Recouvrement client", label: "Problème prélèvement ou Recouvrement client" },
    { value: "Problème ou demande facture", label: "Problème ou demande facture" },
  ],
  "Fontaine à eau": [
    { value: "Demande de livraison CO₂", label: "Demande de livraison CO₂" },
    { value: "Demande de renseignements", label: "Demande de renseignements" },
    { value: "Panne ou dysfonctionnement", label: "Panne ou dysfonctionnement" },
    { value: "Insatisfaction (goût, pétillant, etc.)", label: "Insatisfaction (goût, pétillant, etc.)" },
  ],
  "Immeuble": [
    { value: "Demande de renseignements", label: "Demande de renseignements" },
  ],
  "Imprimantes": [
    { value: "Demande de renseignements", label: "Demande de renseignements" },
    { value: "Panne ou dysfonctionnement", label: "Panne ou dysfonctionnement" },
  ],
  "Internet / Réseau": [
    { value: "Demande de renseignements", label: "Demande de renseignements" },
    { value: "Panne ou dysfonctionnement", label: "Panne ou dysfonctionnement" },
  ],
  "Interphone": [
    { value: "Demande de renseignements", label: "Demande de renseignements" },
    { value: "Panne ou dysfonctionnement", label: "Panne ou dysfonctionnement" },
  ],
  "Isolation phonique": [
    { value: "Demande de renseignements", label: "Demande de renseignements" },
  ],
  "Juridique": [
    { value: "Préavis", label: "Préavis" },
  ],
  "Ménage": [
    { value: "Demande de renseignements", label: "Demande de renseignements" },
    { value: "Insatisfaction", label: "Insatisfaction" },
  ],
  "Nuisances": [
    { value: "Mauvaises odeurs", label: "Mauvaises odeurs" },
    { value: "Nuisances lumineuses", label: "Nuisances lumineuses" },
    { value: "Nuisances sonores", label: "Nuisances sonores" },
  ],
  "Nuisibles": [
    { value: "Mouches / Moucherons", label: "Mouches / Moucherons" },
    { value: "Vermines", label: "Vermines" },
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
  "Vidéosurveillance / Alarme": [
    { value: "Cambriolage - demande rapport client", label: "Cambriolage - demande rapport client" },
    { value: "Panne ou dysfonctionnement", label: "Panne ou dysfonctionnement" },
    { value: "Cambriolage - demande d'informations", label: "Cambriolage - demande d'informations" },
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
