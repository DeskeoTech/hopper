import type { TicketRequestType } from "@/lib/types/database"

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

export const REQUEST_TYPE_OPTIONS = Object.entries(REQUEST_TYPE_LABELS).map(([value, label]) => ({
  value,
  label,
}))

export const REQUEST_SUBTYPE_OPTIONS: Partial<Record<TicketRequestType, { value: string; label: string }[]>> = {
  ascenseurs: [
    { value: "demande_renseignements", label: "Demande de renseignements" },
    { value: "panne_dysfonctionnement", label: "Panne ou dysfonctionnement" },
  ],
  audiovisuel: [
    { value: "demande_renseignements", label: "Demande de renseignements" },
    { value: "panne_dysfonctionnement", label: "Panne ou dysfonctionnement" },
  ],
  administratif: [
    { value: "demande_credits", label: "Demande relative aux crédits" },
    { value: "question_abonnement_cafe", label: "Question sur l'abonnement café" },
    { value: "envoi_question_preavis", label: "Envoi/Question sur préavis" },
    { value: "demande_info_contractuelle", label: "Demande d'information contractuelle" },
  ],
  badges: [
    { value: "demande_renseignements", label: "Demande de renseignements" },
  ],
  catering: [
    { value: "petit_dejeuner", label: "Petit-déjeuner" },
    { value: "livraison_snacks", label: "Livraison snacks, fruits, etc." },
  ],
  chauffage: [
    { value: "demande_renseignements", label: "Demande de renseignements" },
    { value: "panne_dysfonctionnement", label: "Panne ou dysfonctionnement" },
  ],
  climatisation: [
    { value: "demande_renseignements", label: "Demande de renseignements" },
    { value: "panne_dysfonctionnement", label: "Panne ou dysfonctionnement" },
  ],
  code_acces: [
    { value: "demande_renseignements", label: "Demande de renseignements" },
    { value: "panne_dysfonctionnement", label: "Panne ou dysfonctionnement" },
  ],
  electricite: [
    { value: "demande_renseignements", label: "Demande de renseignements" },
    { value: "panne_dysfonctionnement", label: "Panne ou dysfonctionnement" },
  ],
  electromenager: [
    { value: "demande_renseignements", label: "Demande de renseignements" },
    { value: "panne_dysfonctionnement", label: "Panne ou dysfonctionnement" },
  ],
  espaces_verts: [
    { value: "insatisfaction", label: "Insatisfaction" },
  ],
  fenetres: [
    { value: "demande_renseignements", label: "Demande de renseignements" },
    { value: "panne_dysfonctionnement", label: "Panne ou dysfonctionnement" },
  ],
  finance: [
    { value: "probleme_prelevement_recouvrement", label: "Problème prélèvement ou Recouvrement client" },
    { value: "probleme_demande_facture", label: "Problème ou demande facture" },
  ],
  fontaine_eau: [
    { value: "demande_livraison_co2", label: "Demande de livraison CO₂" },
    { value: "demande_renseignements", label: "Demande de renseignements" },
    { value: "panne_dysfonctionnement", label: "Panne ou dysfonctionnement" },
    { value: "insatisfaction_gout", label: "Insatisfaction (goût, pétillant, etc.)" },
  ],
  immeuble: [
    { value: "demande_renseignements", label: "Demande de renseignements" },
  ],
  imprimantes: [
    { value: "demande_renseignements", label: "Demande de renseignements" },
    { value: "panne_dysfonctionnement", label: "Panne ou dysfonctionnement" },
  ],
  internet_reseau: [
    { value: "demande_renseignements", label: "Demande de renseignements" },
    { value: "panne_dysfonctionnement", label: "Panne ou dysfonctionnement" },
  ],
  interphone: [
    { value: "demande_renseignements", label: "Demande de renseignements" },
    { value: "panne_dysfonctionnement", label: "Panne ou dysfonctionnement" },
  ],
  isolation_phonique: [
    { value: "demande_renseignements", label: "Demande de renseignements" },
  ],
  juridique: [
    { value: "preavis", label: "Préavis" },
  ],
  menage: [
    { value: "demande_renseignements", label: "Demande de renseignements" },
    { value: "insatisfaction", label: "Insatisfaction" },
  ],
  nuisances: [
    { value: "mauvaises_odeurs", label: "Mauvaises odeurs" },
    { value: "nuisances_lumineuses", label: "Nuisances lumineuses" },
    { value: "nuisances_sonores", label: "Nuisances sonores" },
  ],
  nuisibles: [
    { value: "mouches_moucherons", label: "Mouches / Moucherons" },
    { value: "vermines", label: "Vermines" },
  ],
  plomberie: [
    { value: "fuite_infiltration", label: "Fuite ou infiltration" },
    { value: "panne_dysfonctionnement", label: "Panne ou dysfonctionnement" },
  ],
  portes: [
    { value: "demande_renseignements", label: "Demande de renseignements" },
    { value: "panne_dysfonctionnement", label: "Panne ou dysfonctionnement" },
    { value: "porte_parking_bloquee", label: "Porte parking bloquée/cassée" },
  ],
  ssi: [
    { value: "demande_renseignements", label: "Demande de renseignements" },
    { value: "panne_dysfonctionnement", label: "Panne ou dysfonctionnement" },
  ],
  videosurveillance_alarme: [
    { value: "cambriolage_rapport", label: "Cambriolage - demande rapport client" },
    { value: "panne_dysfonctionnement", label: "Panne ou dysfonctionnement" },
    { value: "cambriolage_informations", label: "Cambriolage - demande d'informations" },
  ],
}

/** Get the display label for a subtype value */
export function getSubtypeLabel(requestType: TicketRequestType | null, subtypeValue: string | null): string | null {
  if (!requestType || !subtypeValue) return null
  const options = REQUEST_SUBTYPE_OPTIONS[requestType]
  if (!options) return subtypeValue
  const found = options.find((o) => o.value === subtypeValue)
  return found?.label || subtypeValue
}
