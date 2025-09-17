// components/ai/regenerate-button.tsx
// AI 결과를 재생성하는 버튼 컴포넌트
// 확인 모달과 함께 재생성 기능을 제공하고 rate limiting 처리
// 관련 파일: lib/actions/notes.ts, components/ui/modal.tsx

'use client'

import { useState } from 'react'
import { RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface RegenerateButtonProps {
  type: 'summary' | 'tags'
  noteId: string
  isProcessing?: boolean
  onRegenerate: () => Promise<void>
  disabled?: boolean
  size?: 'default' | 'sm' | 'lg' | 'icon'
  variant?: 'default' | 'outline' | 'ghost'
  showConfirmModal?: boolean
  className?: string
}

export function RegenerateButton({
  type,
  noteId: _noteId,
  isProcessing = false,
  onRegenerate,
  disabled = false,
  size = 'sm',
  variant = 'outline',
  showConfirmModal = true,
  className = ''
}: RegenerateButtonProps) {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isRegenerating, setIsRegenerating] = useState(false)

  const typeLabel = type === 'summary' ? '요약' : '태그'

  const handleClick = () => {
    if (showConfirmModal) {
      setIsModalOpen(true)
    } else {
      handleRegenerate()
    }
  }

  const handleRegenerate = async () => {
    setIsRegenerating(true)
    setIsModalOpen(false)

    try {
      await onRegenerate()
    } catch (error) {
      console.error('재생성 중 오류:', error)
    } finally {
      setIsRegenerating(false)
    }
  }

  const isButtonDisabled = disabled || isProcessing || isRegenerating

  return (
    <>
      <Button
        variant={variant}
        size={size}
        onClick={handleClick}
        disabled={isButtonDisabled}
        className={`gap-1 ${className}`}
        title={`${typeLabel} 재생성`}
        aria-label={`${typeLabel} 재생성`}
      >
        <RefreshCw 
          className={`h-3 w-3 ${(isProcessing || isRegenerating) ? 'animate-spin' : ''}`} 
        />
        {isRegenerating ? '재생성 중...' : '재생성'}
      </Button>

      {/* 확인 모달 */}
      {showConfirmModal && isModalOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={() => setIsModalOpen(false)}
        >
          <div 
            className="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {typeLabel} 재생성 확인
            </h3>
            <p className="text-gray-600 mb-4">
              현재 {typeLabel}을 삭제하고 새로운 {typeLabel}을 생성합니다. 
              이 작업은 되돌릴 수 없습니다.
            </p>
            <p className="text-sm text-gray-500 mb-6">
              재생성은 5초 간격으로 제한됩니다.
            </p>
            
            <div className="flex gap-3 justify-end">
              <Button
                variant="outline"
                onClick={() => setIsModalOpen(false)}
                disabled={isRegenerating}
              >
                취소
              </Button>
              <Button
                onClick={handleRegenerate}
                disabled={isRegenerating}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {isRegenerating ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin mr-1" />
                    재생성 중...
                  </>
                ) : (
                  '재생성'
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

// 간단한 재생성 버튼 (모달 없음)
interface SimpleRegenerateButtonProps {
  type: 'summary' | 'tags'
  onRegenerate: () => Promise<void>
  isProcessing?: boolean
  disabled?: boolean
  className?: string
}

export function SimpleRegenerateButton({
  type,
  onRegenerate,
  isProcessing = false,
  disabled = false,
  className = ''
}: SimpleRegenerateButtonProps) {
  return (
    <RegenerateButton
      type={type}
      noteId=""
      onRegenerate={onRegenerate}
      isProcessing={isProcessing}
      disabled={disabled}
      showConfirmModal={false}
      variant="ghost"
      size="sm"
      className={className}
    />
  )
}

// 아이콘만 있는 컴팩트 버전
interface CompactRegenerateButtonProps {
  type: 'summary' | 'tags'
  onRegenerate: () => Promise<void>
  isProcessing?: boolean
  disabled?: boolean
  className?: string
}

export function CompactRegenerateButton({
  type,
  onRegenerate,
  isProcessing = false,
  disabled = false,
  className = ''
}: CompactRegenerateButtonProps) {
  const [isRegenerating, setIsRegenerating] = useState(false)
  const typeLabel = type === 'summary' ? '요약' : '태그'

  const handleRegenerate = async () => {
    setIsRegenerating(true)
    try {
      await onRegenerate()
    } catch (error) {
      console.error('재생성 중 오류:', error)
    } finally {
      setIsRegenerating(false)
    }
  }

  const isButtonDisabled = disabled || isProcessing || isRegenerating

  return (
    <button
      onClick={handleRegenerate}
      disabled={isButtonDisabled}
      className={`
        inline-flex items-center justify-center w-6 h-6 rounded-full
        hover:bg-gray-100 active:bg-gray-200 transition-colors
        disabled:opacity-50 disabled:cursor-not-allowed
        ${className}
      `}
      title={`${typeLabel} 재생성`}
      aria-label={`${typeLabel} 재생성`}
    >
      <RefreshCw 
        className={`h-3 w-3 text-gray-500 ${(isProcessing || isRegenerating) ? 'animate-spin' : ''}`} 
      />
    </button>
  )
}
