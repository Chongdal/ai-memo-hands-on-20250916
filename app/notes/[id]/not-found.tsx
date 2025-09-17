import Link from 'next/link'
import { FileX, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardTitle } from '@/components/ui/card'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <Card className="text-center py-12">
          <CardContent>
            <FileX className="w-16 h-16 text-gray-400 mx-auto mb-6" />
            <CardTitle className="text-2xl mb-2">노트를 찾을 수 없습니다</CardTitle>
            <CardDescription className="mb-8 text-base">
              요청하신 노트가 존재하지 않거나 접근 권한이 없습니다.
              <br />
              노트가 삭제되었거나 잘못된 링크일 수 있습니다.
            </CardDescription>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button asChild>
                <Link href="/notes">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  노트 목록으로 돌아가기
                </Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/notes/new">
                  새 노트 작성하기
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

