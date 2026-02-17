import { cookies } from 'next/headers'
import { getRequestConfig } from 'next-intl/server'
import { defaultLocale, locales } from './config'
import type { Locale } from './config'

export default getRequestConfig(async () => {
  const store = await cookies()
  const cookieLocale = store.get('locale')?.value
  const locale: Locale = (locales as readonly string[]).includes(cookieLocale ?? '')
    ? (cookieLocale as Locale)
    : defaultLocale

  const [common, reservation, equipment, calendar, modals] = await Promise.all([
    import(`../messages/${locale}/common.json`),
    import(`../messages/${locale}/reservation.json`),
    import(`../messages/${locale}/equipment.json`),
    import(`../messages/${locale}/calendar.json`),
    import(`../messages/${locale}/modals.json`),
  ])

  const messages = {
    common: common.default,
    reservation: reservation.default,
    ...equipment.default,
    ...calendar.default,
    ...modals.default,
  }

  return {
    locale,
    messages,
  }
})
