import { NextResponse } from 'next/server'
// The client you created from the Server-Side Auth instructions
import { createClient } from '@/utils/supabase/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const error = searchParams.get('error')
  const errorCode = searchParams.get('error_code')
  const errorDescription = searchParams.get('error_description')

  // if "next" is in search params, use it as the redirection URL
  const next = searchParams.get('next') ?? '/dashboard'

  if (error) {
    console.error('Auth callback error:', { error, errorCode, errorDescription })
    return NextResponse.redirect(`${origin}/auth/auth-code-error?error=${error}&code=${errorCode}&description=${encodeURIComponent(errorDescription || '')}`)
  }

  if (code) {
    const supabase = await createClient()
    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
    if (!exchangeError) {
      const forwardedHost = request.headers.get('x-forwarded-host') // if available, use it for redirection
      const isLocalEnv = process.env.NODE_ENV === 'development'

      const redirectUrl = new URL(next, origin)

      if (!isLocalEnv && forwardedHost) {
        return NextResponse.redirect(`https://${forwardedHost}${next}`)
      }
      return NextResponse.redirect(redirectUrl.toString())
    } else {
      console.error('Auth exchange error:', exchangeError)
      return NextResponse.redirect(`${origin}/auth/auth-code-error?error=exchange_error&description=${encodeURIComponent(exchangeError.message)}`)
    }
  }

  // return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/auth/auth-code-error`)
}
