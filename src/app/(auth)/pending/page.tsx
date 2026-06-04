'use client'

import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function PendingPage() {
  const router = useRouter()
  const supabase = createClient()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <div className="min-h-screen bg-[#f4f5f7] flex flex-col">
      <div className="bg-[#1a2744] text-white px-6 py-3 flex items-center gap-3">
        <div className="bg-[#c41230] text-white font-black text-lg px-3 py-1 rounded tracking-tight">CMC</div>
        <div>
          <div className="font-bold text-lg leading-tight">CustomMyCar</div>
          <div className="text-xs text-gray-400">vollkommen 공식 거래처 포털</div>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center px-4">
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-10 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">승인 대기 중</h2>
          <p className="text-gray-500 text-sm leading-relaxed mb-6">
            가입 신청이 접수되었습니다.<br />
            담당자 검토 후 승인이 완료되면 이메일로 안내 드립니다.<br />
            <br />
            승인까지 영업일 기준 1~2일 소요됩니다.
          </p>
          <div className="bg-gray-50 rounded p-3 text-xs text-gray-500 mb-6">
            문의: <a href="mailto:support@custommycar.kr" className="text-[#1a2744] font-medium">support@custommycar.kr</a>
          </div>
          <button
            onClick={handleLogout}
            className="text-sm text-gray-500 hover:text-gray-700 underline"
          >
            로그아웃
          </button>
        </div>
      </div>
    </div>
  )
}
