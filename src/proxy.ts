import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Proteger la ruta /dashboard y todas sus subrutas
  if (pathname.startsWith('/dashboard')) {
    const accessToken = request.cookies.get('insforge_access_token')?.value

    if (!accessToken) {
      return NextResponse.redirect(new URL('/', request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/dashboard/:path*']
}
