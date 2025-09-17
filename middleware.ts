import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
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
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          response = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // 세션 새로고침 (중요: 이것이 쿠키를 업데이트합니다)
  const { data: { user } } = await supabase.auth.getUser()

  // 인증이 필요한 경로 보호
  if (request.nextUrl.pathname.startsWith('/notes') && !user) {
    return NextResponse.redirect(new URL('/signin?message=login-required', request.url))
  }

  // 인증된 사용자가 로그인/회원가입 페이지에 접근하면 노트 페이지로 리다이렉트
  // (홈페이지는 로그아웃 후 보여줄 수 있도록 제외)
  if ((request.nextUrl.pathname === '/signin' || 
       request.nextUrl.pathname === '/signup') && user) {
    return NextResponse.redirect(new URL('/notes', request.url))
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}

