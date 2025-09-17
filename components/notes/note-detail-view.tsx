'use client'

interface Note {
  id: string
  title: string
  content: string | null
  created_at: string
  updated_at: string
}

interface NoteDetailViewProps {
  note: Note
  className?: string
}

function formatDate(dateString: string) {
  const date = new Date(dateString)
  return date.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

export function NoteDetailView({ note, className = '' }: NoteDetailViewProps) {
  return (
    <div className={`${className}`}>
      {/* 노트 제목 */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 break-words">
          {note.title}
        </h1>
        
        {/* 메타 정보 */}
        <div className="mt-4 flex flex-col sm:flex-row sm:items-center sm:space-x-6 space-y-2 sm:space-y-0 text-sm text-gray-500">
          <div>
            <span className="font-medium">생성일:</span>{' '}
            <time dateTime={note.created_at}>
              {formatDate(note.created_at)}
            </time>
          </div>
          {note.updated_at !== note.created_at && (
            <div>
              <span className="font-medium">수정일:</span>{' '}
              <time dateTime={note.updated_at}>
                {formatDate(note.updated_at)}
              </time>
            </div>
          )}
        </div>
      </div>

      {/* 노트 내용 */}
      <div className="prose max-w-none">
        {note.content ? (
          <div 
            className="whitespace-pre-wrap text-gray-800 leading-relaxed break-words"
            style={{ 
              whiteSpace: 'pre-wrap',
              wordWrap: 'break-word',
              overflowWrap: 'break-word'
            }}
          >
            {note.content}
          </div>
        ) : (
          <div className="text-gray-400 italic">
            내용이 없습니다.
          </div>
        )}
      </div>
    </div>
  )
}

