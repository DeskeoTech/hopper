"use server"

import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { locales, defaultLocale } from '@/i18n/config'

export async function setLocaleAction(locale: string) {
  const validLocale = (locales as readonly string[]).includes(locale) ? locale : defaultLocale

  const store = await cookies()
  store.set('locale', validLocale, {
    path: '/',
    maxAge: 60 * 60 * 24 * 365, // 1 an
    sameSite: 'lax',
  })

  revalidatePath('/', 'layout')
}
