// app/token-usage/token-usage-page-client.tsx
// 토큰 사용량 모니터링 페이지의 클라이언트 컴포넌트
// 실시간 데이터 로딩과 사용자 인터랙션 처리
// 관련 파일: components/ai/token-usage-display.tsx, app/api/token-usage/route.ts

'use client'

import { useState, useEffect } from 'react'
import { Activity, DollarSign, BarChart3, TrendingUp, Download, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

interface TokenUsageStats {
  totalTokens: number
  inputTokens: number
  outputTokens: number
  totalCost: number
  requestCount: number
  successRate: number
  averageTokensPerRequest: number
  averageProcessingTime: number
}

interface TokenUsageData {
  id: string
  note_id: string
  type: string
  model: string
  input_tokens: number
  output_tokens: number
  total_tokens: number
  cost: number
  processing_time: number
  success: boolean
  error_type?: string
  created_at: string
}

interface TokenUsagePageClientProps {
  userId: string
}

export function TokenUsagePageClient({ userId: _userId }: TokenUsagePageClientProps) {
  const [dailyStats, setDailyStats] = useState<TokenUsageStats | null>(null)
  const [monthlyStats, setMonthlyStats] = useState<TokenUsageStats | null>(null)
  const [recentUsage, setRecentUsage] = useState<TokenUsageData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [period, setPeriod] = useState<'daily' | 'monthly'>('daily')

  useEffect(() => {
    loadUsageData()
  }, [period])

  const loadUsageData = async () => {
    try {
      setLoading(true)
      setError('')

      // 일일 및 월간 데이터 로드
      const [dailyResponse, monthlyResponse] = await Promise.all([
        fetch(`/api/token-usage?period=daily&limit=30`),
        fetch(`/api/token-usage?period=monthly&limit=100`)
      ])

      if (!dailyResponse.ok || !monthlyResponse.ok) {
        throw new Error('데이터를 불러올 수 없습니다.')
      }

      const dailyData = await dailyResponse.json()
      const monthlyData = await monthlyResponse.json()

      if (dailyData.success) {
        setDailyStats(dailyData.data.stats)
        setRecentUsage(dailyData.data.usage)
      }

      if (monthlyData.success) {
        setMonthlyStats(monthlyData.data.stats)
      }

    } catch (error) {
      console.error('사용량 데이터 로드 실패:', error)
      setError('사용량 정보를 불러올 수 없습니다.')
    } finally {
      setLoading(false)
    }
  }

  const handleRefresh = () => {
    loadUsageData()
  }

  const handleExport = async () => {
    try {
      const response = await fetch(`/api/token-usage?period=${period}&limit=1000`)
      const data = await response.json()
      
      if (data.success) {
        // CSV 데이터 생성
        const csvData = [
          ['날짜', '타입', '모델', '입력 토큰', '출력 토큰', '총 토큰', '비용', '처리 시간', '성공 여부'],
          ...data.data.usage.map((item: TokenUsageData) => [
            new Date(item.created_at).toLocaleDateString('ko-KR'),
            item.type,
            item.model,
            item.input_tokens,
            item.output_tokens,
            item.total_tokens,
            item.cost.toFixed(6),
            item.processing_time,
            item.success ? '성공' : '실패'
          ])
        ].map(row => row.join(',')).join('\n')

        // 파일 다운로드
        const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' })
        const link = document.createElement('a')
        const url = URL.createObjectURL(blob)
        link.setAttribute('href', url)
        link.setAttribute('download', `token-usage-${period}-${new Date().toISOString().split('T')[0]}.csv`)
        link.style.visibility = 'hidden'
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
      }
    } catch (error) {
      console.error('데이터 내보내기 실패:', error)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex items-center space-x-2">
          <RefreshCw className="h-5 w-5 animate-spin text-blue-500" />
          <span className="text-gray-600">사용량 데이터를 불러오는 중...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-red-600 mb-4">{error}</div>
        <Button onClick={handleRefresh} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          다시 시도
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* 컨트롤 */}
      <div className="flex justify-between items-center">
        <div className="flex space-x-2">
          <Button
            variant={period === 'daily' ? 'default' : 'outline'}
            onClick={() => setPeriod('daily')}
          >
            일간
          </Button>
          <Button
            variant={period === 'monthly' ? 'default' : 'outline'}
            onClick={() => setPeriod('monthly')}
          >
            월간
          </Button>
        </div>
        
        <div className="flex space-x-2">
          <Button onClick={handleRefresh} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            새로고침
          </Button>
          <Button onClick={handleExport} variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            내보내기
          </Button>
        </div>
      </div>

      {/* 요약 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <UsageCard
          title="총 토큰 사용량"
          value={period === 'daily' ? dailyStats?.totalTokens || 0 : monthlyStats?.totalTokens || 0}
          unit="tokens"
          icon={<Activity className="h-4 w-4" />}
          color="blue"
          subtitle={`${period === 'daily' ? dailyStats?.requestCount || 0 : monthlyStats?.requestCount || 0}회 요청`}
        />
        
        <UsageCard
          title="총 비용"
          value={period === 'daily' ? dailyStats?.totalCost || 0 : monthlyStats?.totalCost || 0}
          unit="USD"
          icon={<DollarSign className="h-4 w-4" />}
          color="green"
          subtitle={`성공률 ${(period === 'daily' ? dailyStats?.successRate || 0 : monthlyStats?.successRate || 0).toFixed(1)}%`}
        />
        
        <UsageCard
          title="입력 토큰"
          value={period === 'daily' ? dailyStats?.inputTokens || 0 : monthlyStats?.inputTokens || 0}
          unit="tokens"
          icon={<BarChart3 className="h-4 w-4" />}
          color="purple"
          subtitle={`평균 ${(period === 'daily' ? dailyStats?.averageTokensPerRequest || 0 : monthlyStats?.averageTokensPerRequest || 0).toFixed(0)}토큰/요청`}
        />
        
        <UsageCard
          title="출력 토큰"
          value={period === 'daily' ? dailyStats?.outputTokens || 0 : monthlyStats?.outputTokens || 0}
          unit="tokens"
          icon={<TrendingUp className="h-4 w-4" />}
          color="orange"
          subtitle={`평균 처리시간 ${(period === 'daily' ? dailyStats?.averageProcessingTime || 0 : monthlyStats?.averageProcessingTime || 0).toFixed(0)}ms`}
        />
      </div>

      {/* 최근 사용량 목록 */}
      <Card className="p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">최근 사용량 기록</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  날짜
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  타입
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  모델
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  토큰
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  비용
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  상태
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {recentUsage.map((item) => (
                <tr key={item.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {new Date(item.created_at).toLocaleString('ko-KR')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {item.type}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {item.model}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {item.total_tokens.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    ${item.cost.toFixed(6)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      item.success 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {item.success ? '성공' : '실패'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}

// 사용량 카드 컴포넌트
interface UsageCardProps {
  title: string
  value: number
  unit: string
  icon: React.ReactNode
  color: 'blue' | 'green' | 'purple' | 'orange'
  subtitle: string
}

function UsageCard({ title, value, unit, icon, color, subtitle }: UsageCardProps) {
  const colorClasses = {
    blue: 'text-blue-600 bg-blue-100',
    green: 'text-green-600 bg-green-100',
    purple: 'text-purple-600 bg-purple-100',
    orange: 'text-orange-600 bg-orange-100'
  }

  return (
    <Card className="p-6">
      <div className="flex items-center">
        <div className={`p-2 rounded-lg ${colorClasses[color]}`}>
          {icon}
        </div>
        <div className="ml-4">
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-semibold text-gray-900">
            {value.toLocaleString()} {unit}
          </p>
          <p className="text-xs text-gray-500">{subtitle}</p>
        </div>
      </div>
    </Card>
  )
}
