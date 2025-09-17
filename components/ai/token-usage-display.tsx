// components/ai/token-usage-display.tsx
// 토큰 사용량을 시각적으로 표시하는 컴포넌트
// 실시간 사용량, 통계, 비용 정보를 차트와 함께 제공
// 관련 파일: lib/ai/token-usage-tracker.ts

'use client'

import { useState, useEffect } from 'react'
import { BarChart3, DollarSign, Activity, TrendingUp, AlertTriangle } from 'lucide-react'
import { TokenUsageStats } from '@/lib/ai/token-usage-tracker'

interface TokenUsageDisplayProps {
  userId?: string
  showDetails?: boolean
  className?: string
}

export function TokenUsageDisplay({ 
  userId, 
  showDetails = true, 
  className = '' 
}: TokenUsageDisplayProps) {
  const [dailyStats, setDailyStats] = useState<TokenUsageStats | null>(null)
  const [monthlyStats, setMonthlyStats] = useState<TokenUsageStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    loadUsageStats()
  }, [userId])

  const loadUsageStats = async () => {
    try {
      setLoading(true)
      setError('')

      // 실제 구현에서는 API 엔드포인트 호출
      // 여기서는 예시 데이터 사용
      const mockDailyStats: TokenUsageStats = {
        totalTokens: 15420,
        inputTokens: 12336,
        outputTokens: 3084,
        totalCost: 1.23,
        requestCount: 8,
        successRate: 87.5,
        averageTokensPerRequest: 1927,
        averageProcessingTime: 2340
      }

      const mockMonthlyStats: TokenUsageStats = {
        totalTokens: 234560,
        inputTokens: 187648,
        outputTokens: 46912,
        totalCost: 18.65,
        requestCount: 156,
        successRate: 92.3,
        averageTokensPerRequest: 1504,
        averageProcessingTime: 2180
      }

      setDailyStats(mockDailyStats)
      setMonthlyStats(mockMonthlyStats)

    } catch (error) {
      console.error('사용량 통계 로드 실패:', error)
      setError('사용량 정보를 불러올 수 없습니다.')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className={`p-4 bg-gray-50 rounded-lg border ${className}`}>
        <div className="flex items-center space-x-2">
          <Activity className="h-4 w-4 animate-pulse text-blue-500" />
          <span className="text-sm text-gray-600">토큰 사용량 로딩 중...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className={`p-4 bg-red-50 border border-red-200 rounded-lg ${className}`}>
        <div className="flex items-center space-x-2">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <span className="text-sm text-red-700">{error}</span>
        </div>
      </div>
    )
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* 요약 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <TokenUsageCard
          title="오늘 사용량"
          value={dailyStats?.totalTokens || 0}
          unit="tokens"
          icon={<Activity className="h-4 w-4" />}
          color="blue"
          subtitle={`${dailyStats?.requestCount || 0}회 요청`}
        />
        
        <TokenUsageCard
          title="오늘 비용"
          value={dailyStats?.totalCost || 0}
          unit="USD"
          icon={<DollarSign className="h-4 w-4" />}
          color="green"
          subtitle={`성공률 ${dailyStats?.successRate.toFixed(1) || 0}%`}
        />
        
        <TokenUsageCard
          title="이번 달 사용량"
          value={monthlyStats?.totalTokens || 0}
          unit="tokens"
          icon={<BarChart3 className="h-4 w-4" />}
          color="purple"
          subtitle={`${monthlyStats?.requestCount || 0}회 요청`}
        />
        
        <TokenUsageCard
          title="이번 달 비용"
          value={monthlyStats?.totalCost || 0}
          unit="USD"
          icon={<TrendingUp className="h-4 w-4" />}
          color="orange"
          subtitle="월 한도 $100"
        />
      </div>

      {/* 상세 정보 */}
      {showDetails && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* 일일 상세 */}
          <div className="p-4 bg-white rounded-lg border">
            <h3 className="font-medium text-gray-900 mb-3 flex items-center space-x-2">
              <Activity className="h-4 w-4 text-blue-500" />
              <span>오늘 상세 사용량</span>
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">입력 토큰:</span>
                <span className="font-medium">{dailyStats?.inputTokens.toLocaleString() || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">출력 토큰:</span>
                <span className="font-medium">{dailyStats?.outputTokens.toLocaleString() || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">평균 처리 시간:</span>
                <span className="font-medium">{dailyStats?.averageProcessingTime.toFixed(0) || 0}ms</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">요청당 평균 토큰:</span>
                <span className="font-medium">{dailyStats?.averageTokensPerRequest.toFixed(0) || 0}</span>
              </div>
            </div>
          </div>

          {/* 월간 상세 */}
          <div className="p-4 bg-white rounded-lg border">
            <h3 className="font-medium text-gray-900 mb-3 flex items-center space-x-2">
              <BarChart3 className="h-4 w-4 text-purple-500" />
              <span>이번 달 상세 사용량</span>
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">입력 토큰:</span>
                <span className="font-medium">{monthlyStats?.inputTokens.toLocaleString() || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">출력 토큰:</span>
                <span className="font-medium">{monthlyStats?.outputTokens.toLocaleString() || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">평균 처리 시간:</span>
                <span className="font-medium">{monthlyStats?.averageProcessingTime.toFixed(0) || 0}ms</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">요청당 평균 토큰:</span>
                <span className="font-medium">{monthlyStats?.averageTokensPerRequest.toFixed(0) || 0}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 사용량 막대 그래프 */}
      <div className="p-4 bg-white rounded-lg border">
        <h3 className="font-medium text-gray-900 mb-3">사용량 현황</h3>
        <div className="space-y-3">
          <UsageProgressBar
            label="일일 토큰 사용량"
            current={dailyStats?.totalTokens || 0}
            max={100000}
            color="blue"
          />
          <UsageProgressBar
            label="일일 비용"
            current={dailyStats?.totalCost || 0}
            max={10}
            color="green"
            unit="USD"
          />
          <UsageProgressBar
            label="월간 토큰 사용량"
            current={monthlyStats?.totalTokens || 0}
            max={2000000}
            color="purple"
          />
          <UsageProgressBar
            label="월간 비용"
            current={monthlyStats?.totalCost || 0}
            max={100}
            color="orange"
            unit="USD"
          />
        </div>
      </div>
    </div>
  )
}

// 토큰 사용량 카드 컴포넌트
interface TokenUsageCardProps {
  title: string
  value: number
  unit: string
  icon: React.ReactNode
  color: 'blue' | 'green' | 'purple' | 'orange'
  subtitle?: string
}

function TokenUsageCard({ title, value, unit, icon, color, subtitle }: TokenUsageCardProps) {
  const colorClasses = {
    blue: 'bg-blue-50 border-blue-200 text-blue-600',
    green: 'bg-green-50 border-green-200 text-green-600',
    purple: 'bg-purple-50 border-purple-200 text-purple-600',
    orange: 'bg-orange-50 border-orange-200 text-orange-600'
  }

  const formatValue = (val: number, unit: string) => {
    if (unit === 'tokens') {
      return val.toLocaleString()
    } else if (unit === 'USD') {
      return `$${val.toFixed(2)}`
    }
    return val.toString()
  }

  return (
    <div className={`p-4 rounded-lg border ${colorClasses[color]}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900">
            {formatValue(value, unit)}
          </p>
          {subtitle && (
            <p className="text-xs text-gray-500 mt-1">{subtitle}</p>
          )}
        </div>
        <div className={`p-2 rounded-full ${colorClasses[color]}`}>
          {icon}
        </div>
      </div>
    </div>
  )
}

// 사용량 진행 바 컴포넌트
interface UsageProgressBarProps {
  label: string
  current: number
  max: number
  color: 'blue' | 'green' | 'purple' | 'orange'
  unit?: string
}

function UsageProgressBar({ label, current, max, color, unit = 'tokens' }: UsageProgressBarProps) {
  const percentage = Math.min((current / max) * 100, 100)
  const isNearLimit = percentage > 80
  const isOverLimit = percentage >= 100

  const colorClasses = {
    blue: 'bg-blue-500',
    green: 'bg-green-500',
    purple: 'bg-purple-500',
    orange: 'bg-orange-500'
  }

  const formatValue = (val: number) => {
    if (unit === 'tokens') {
      return val.toLocaleString()
    } else if (unit === 'USD') {
      return `$${val.toFixed(2)}`
    }
    return val.toString()
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-1">
        <span className="text-sm font-medium text-gray-700">{label}</span>
        <span className={`text-sm ${isOverLimit ? 'text-red-600' : isNearLimit ? 'text-orange-600' : 'text-gray-600'}`}>
          {formatValue(current)} / {formatValue(max)}
        </span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className={`h-2 rounded-full transition-all duration-300 ${
            isOverLimit ? 'bg-red-500' : isNearLimit ? 'bg-orange-500' : colorClasses[color]
          }`}
          style={{ width: `${Math.min(percentage, 100)}%` }}
        />
      </div>
      <div className="flex justify-between text-xs text-gray-500 mt-1">
        <span>{percentage.toFixed(1)}% 사용</span>
        {isNearLimit && (
          <span className={isOverLimit ? 'text-red-600' : 'text-orange-600'}>
            {isOverLimit ? '한도 초과' : '한도 임박'}
          </span>
        )}
      </div>
    </div>
  )
}

// 간단한 토큰 사용량 표시 컴포넌트
interface SimpleTokenUsageProps {
  tokens: number
  cost: number
  className?: string
}

export function SimpleTokenUsage({ tokens, cost, className = '' }: SimpleTokenUsageProps) {
  return (
    <div className={`flex items-center space-x-4 text-xs text-gray-500 ${className}`}>
      <div className="flex items-center space-x-1">
        <Activity className="h-3 w-3" />
        <span>{tokens.toLocaleString()} tokens</span>
      </div>
      <div className="flex items-center space-x-1">
        <DollarSign className="h-3 w-3" />
        <span>${cost.toFixed(4)}</span>
      </div>
    </div>
  )
}
