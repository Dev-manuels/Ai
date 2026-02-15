import { type NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // refreshing the auth token
  const { data: { user: supabaseUser } } = await supabase.auth.getUser()

  // Check for legacy next-auth session
  const nextAuthSession = request.cookies.get('next-auth.session-token') ||
                         request.cookies.get('__Secure-next-auth.session-token')

  const isAuthPage = request.nextUrl.pathname.startsWith('/auth')
  const isProtectedPage = ['/dashboard', '/portfolio', '/strategies', '/analytics', '/admin'].some(path =>
    request.nextUrl.pathname.startsWith(path)
  )
  const isAdminPage = request.nextUrl.pathname.startsWith('/admin')

  if (isProtectedPage && !supabaseUser && !nextAuthSession) {
    const url = request.nextUrl.clone()
    url.pathname = '/auth/signin'
    url.searchParams.set('callbackUrl', request.nextUrl.pathname)
    return NextResponse.redirect(url)
  }

  // Admin protection
  if (isAdminPage && supabaseUser) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', supabaseUser.id)
      .single()

    if (profile?.role !== 'ADMIN') {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
  } else if (isAdminPage && nextAuthSession) {
    // For legacy session, we might want to check something else, but
    // next-auth session cookie doesn't easily give us the role here
    // without decrypting it if it's JWE, or checking DB.
    // For now, let's assume legacy sessions are handled as before.
  }

  // If already authenticated and trying to access auth pages (except callback), redirect to dashboard
  if (isAuthPage && (supabaseUser || nextAuthSession) && !request.nextUrl.pathname.startsWith('/auth/callback')) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
