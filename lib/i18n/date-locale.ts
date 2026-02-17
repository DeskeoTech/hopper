import { fr } from 'date-fns/locale/fr'
import { enUS } from 'date-fns/locale/en-US'

const dateLocales: Record<string, typeof fr> = {
  fr,
  en: enUS,
}

export function getDateLocale(locale: string) {
  return dateLocales[locale] || fr
}
