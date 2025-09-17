import { redirect } from 'next/navigation'

interface EditNotePageProps {
  params: {
    id: string
  }
}

// 기존 편집 페이지는 새로운 상세 페이지의 편집 모드로 리다이렉트
export default async function EditNotePage({ params }: EditNotePageProps) {
  const { id } = await params
  redirect(`/notes/${id}?mode=edit`)
}
