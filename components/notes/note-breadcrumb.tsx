import { Breadcrumb } from '@/components/ui/breadcrumb'

interface NoteBreadcrumbProps {
  noteTitle: string
  className?: string
}

export function NoteBreadcrumb({ noteTitle, className }: NoteBreadcrumbProps) {
  const items = [
    { label: '홈', href: '/' },
    { label: '내 노트', href: '/notes' },
    { label: noteTitle, current: true }
  ]

  return <Breadcrumb items={items} className={className} />
}

