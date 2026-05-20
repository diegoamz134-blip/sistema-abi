import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

export function createSupabaseServerClient(accessToken?: string) {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: {
        headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {}
      }
    }
  )
}

const accessCookie = 'insforge_access_token'
const refreshCookie = 'insforge_refresh_token'

const authCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/'
}

export async function setAuthCookies(accessToken: string, refreshToken: string) {
  const cookieStore = await cookies()
  cookieStore.set(accessCookie, accessToken, { ...authCookieOptions, maxAge: 60 * 15 })
  cookieStore.set(refreshCookie, refreshToken, { ...authCookieOptions, maxAge: 60 * 60 * 24 * 7 })
}

export async function clearAuthCookies() {
  const cookieStore = await cookies()
  cookieStore.delete(accessCookie)
  cookieStore.delete(refreshCookie)
}
