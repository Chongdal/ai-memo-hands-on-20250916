'use client'

import { useAuth } from '@/components/auth/auth-provider'
import { Button } from '@/components/ui/button'
import { LogOut, User, BarChart3 } from 'lucide-react'
import Link from 'next/link'

export function UserNav() {
  const { user, signOut, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex items-center space-x-4">
        <div className="w-20 h-8 bg-gray-200 animate-pulse rounded"></div>
      </div>
    )
  }

  if (!user) return null

  return (
    <div className="flex items-center space-x-4">
      <div className="flex items-center space-x-2">
        <User className="h-4 w-4" />
        <span className="text-sm font-medium">{user.email}</span>
      </div>
      
      <Link href="/token-usage">
        <Button
          variant="ghost"
          size="sm"
          className="flex items-center space-x-2"
        >
          <BarChart3 className="h-4 w-4" />
          <span>사용량</span>
        </Button>
      </Link>
      
      <Button
        variant="outline"
        size="sm"
        onClick={signOut}
        className="flex items-center space-x-2"
      >
        <LogOut className="h-4 w-4" />
        <span>로그아웃</span>
      </Button>
    </div>
  )
}
