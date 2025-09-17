'use client'

import { useAuth } from '@/components/auth/auth-provider'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { FileText, PenTool, Zap } from 'lucide-react'
import { UserNav } from '@/components/auth/user-nav'

export default function HomeContent() {
  const { user, loading } = useAuth()

  // 로딩 중이면 로딩 표시
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">로딩 중...</p>
        </div>
      </div>
    )
  }

  // 로그인 상태에 따라 다른 헤더 표시
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* 헤더 */}
      <header className="px-4 lg:px-6 h-14 flex items-center">
        <div className="flex items-center justify-center">
          <FileText className="h-6 w-6 mr-2" />
          <span className="font-bold text-lg">AI 메모장</span>
        </div>
        <nav className="ml-auto flex gap-4 sm:gap-6">
          {user ? (
            // 로그인한 사용자
            <>
              <Button variant="ghost" asChild>
                <Link href="/notes">내 노트</Link>
              </Button>
              <UserNav />
            </>
          ) : (
            // 로그인하지 않은 사용자
            <>
              <Button variant="ghost" asChild>
                <Link href="/signin">로그인</Link>
              </Button>
              <Button asChild>
                <Link href="/signup">회원가입</Link>
              </Button>
            </>
          )}
        </nav>
      </header>

      {/* 메인 콘텐츠 */}
      <main className="flex-1">
        <section className="w-full py-12 md:py-24 lg:py-32">
          <div className="container px-4 md:px-6 mx-auto">
            <div className="flex flex-col items-center space-y-4 text-center">
              <div className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl lg:text-6xl">
                  {user ? `안녕하세요! 👋` : 'AI 메모장에 오신 것을 환영합니다'}
                </h1>
                <p className="mx-auto max-w-[700px] text-gray-500 md:text-xl">
                  {user 
                    ? '오늘도 새로운 아이디어를 기록해보세요. AI가 도와드립니다!'
                    : '음성과 텍스트 입력을 통한 편리한 기록, AI 기반 자동 요약과 태깅으로 더 스마트한 메모 경험을 제공합니다.'
                  }
                </p>
              </div>
              <div className="space-x-4">
                {user ? (
                  // 로그인한 사용자용 버튼
                  <>
                    <Button asChild size="lg">
                      <Link href="/notes/new">
                        새 노트 작성
                      </Link>
                    </Button>
                    <Button variant="outline" size="lg" asChild>
                      <Link href="/notes">
                        내 노트 보기
                      </Link>
                    </Button>
                  </>
                ) : (
                  // 로그인하지 않은 사용자용 버튼
                  <>
                    <Button asChild size="lg">
                      <Link href="/signup">
                        지금 시작하기
                      </Link>
                    </Button>
                    <Button variant="outline" size="lg" asChild>
                      <Link href="/signin">
                        로그인
                      </Link>
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* 기능 소개 */}
        <section className="w-full py-12 md:py-24 lg:py-32 bg-gray-50">
          <div className="container px-4 md:px-6 mx-auto">
            <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl text-center mb-12">
              주요 기능
            </h2>
            <div className="grid gap-6 lg:grid-cols-3">
              <Card>
                <CardHeader>
                  <PenTool className="h-8 w-8 mb-2" />
                  <CardTitle>간편한 노트 작성</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>
                    직관적인 인터페이스로 아이디어를 빠르게 기록하고 체계적으로 관리할 수 있습니다.
                  </CardDescription>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <Zap className="h-8 w-8 mb-2" />
                  <CardTitle>AI 자동 요약</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>
                    긴 메모도 AI가 핵심 내용을 자동으로 요약하여 빠른 이해를 도와드립니다.
                  </CardDescription>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <FileText className="h-8 w-8 mb-2" />
                  <CardTitle>스마트 태깅</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>
                    AI가 자동으로 태그를 생성하여 노트를 쉽게 분류하고 검색할 수 있습니다.
                  </CardDescription>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>
      </main>

      {/* 푸터 */}
      <footer className="flex flex-col gap-2 sm:flex-row py-6 w-full shrink-0 items-center px-4 md:px-6 border-t">
        <p className="text-xs text-gray-500">
          © 2024 AI 메모장. All rights reserved.
        </p>
        <nav className="sm:ml-auto flex gap-4 sm:gap-6">
          <Link className="text-xs hover:underline underline-offset-4" href="/test-gemini">
            🧪 API 테스트
          </Link>
          <Link className="text-xs hover:underline underline-offset-4" href="#">
            이용약관
          </Link>
          <Link className="text-xs hover:underline underline-offset-4" href="#">
            개인정보처리방침
          </Link>
        </nav>
      </footer>
    </div>
  )
}

