import { Metadata } from 'next'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export const metadata: Metadata = {
  title: '온보딩 | AI 메모장',
  description: 'AI 메모장 서비스에 오신 것을 환영합니다',
}

export default function OnboardingPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-2xl space-y-8">
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-3xl font-bold">환영합니다! 🎉</CardTitle>
            <CardDescription className="text-lg">
              AI 메모장 서비스에 가입해주셔서 감사합니다
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4">
              <div className="flex items-start space-x-4">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-blue-600 font-semibold">1</span>
                </div>
                <div>
                  <h3 className="font-semibold">음성 메모 작성</h3>
                  <p className="text-sm text-muted-foreground">
                    음성으로 메모를 작성하고 자동으로 텍스트로 변환됩니다
                  </p>
                </div>
              </div>
              
              <div className="flex items-start space-x-4">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                  <span className="text-green-600 font-semibold">2</span>
                </div>
                <div>
                  <h3 className="font-semibold">AI 요약 및 태깅</h3>
                  <p className="text-sm text-muted-foreground">
                    AI가 자동으로 메모를 요약하고 관련 태그를 생성합니다
                  </p>
                </div>
              </div>
              
              <div className="flex items-start space-x-4">
                <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                  <span className="text-purple-600 font-semibold">3</span>
                </div>
                <div>
                  <h3 className="font-semibold">스마트 검색</h3>
                  <p className="text-sm text-muted-foreground">
                    강력한 검색 기능으로 원하는 메모를 빠르게 찾을 수 있습니다
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 pt-6">
              <Button asChild className="flex-1">
                <Link href="/dashboard">메모 작성 시작하기</Link>
              </Button>
              <Button variant="outline" asChild className="flex-1">
                <Link href="/profile">프로필 설정</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
