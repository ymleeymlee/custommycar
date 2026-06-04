'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const router = useRouter()
  const supabase = createClient()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    const { data, error: authError } = await supabase.auth.signInWithPassword({ email, password })

    if (authError) {
      setError('이메일 또는 비밀번호가 올바르지 않습니다.')
      setLoading(false)
      return
    }

    if (data.user) {
      router.push('/products')
      router.refresh()
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-[#f4f5f7] flex flex-col">
      {/* 헤더 */}
      <div className="bg-[#1a2744] text-white px-6 py-3 flex items-center gap-3">
        <div className="bg-[#c41230] text-white font-black text-lg px-3 py-1 rounded tracking-tight">CMC</div>
        <div>
          <div className="font-bold text-lg leading-tight">CustomMyCar</div>
          <div className="text-xs text-gray-400">vollkommen 공식 거래처 포털</div>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          {/* 안내 배너 */}
          <div className="bg-[#1a2744] text-white rounded-lg p-4 mb-6 text-sm">
            <div className="font-semibold mb-1">거래처 전용 포털</div>
            <div className="text-gray-300 text-xs">본 사이트는 vollkommen 공식 거래처에게만 공개된 비공개 구매 포털입니다. 가입 후 관리자 승인이 필요합니다.</div>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-8">
            <h1 className="text-xl font-bold text-gray-800 mb-6">로그인</h1>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded px-3 py-2 mb-4">
                {error}
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">이메일</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a2744]"
                  placeholder="company@email.com"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">비밀번호</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a2744]"
                  placeholder="••••••••"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#c41230] hover:bg-[#a50e28] disabled:bg-gray-300 text-white font-semibold py-2.5 rounded transition-colors text-sm"
              >
                {loading ? '로그인 중...' : '로그인'}
              </button>
            </form>

            <div className="mt-6 pt-6 border-t border-gray-100 text-center text-sm text-gray-500">
              아직 계정이 없으신가요?{' '}
              <Link href="/register" className="text-[#1a2744] font-semibold hover:underline">
                거래처 가입 신청
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
