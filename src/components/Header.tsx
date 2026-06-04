'use client'

import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useCartStore } from '@/lib/store/cartStore'
import { Profile } from '@/types'

interface HeaderProps {
  profile: Profile | null
}

export default function Header({ profile }: HeaderProps) {
  const router = useRouter()
  const pathname = usePathname()
  const supabase = createClient()
  const totalCount = useCartStore((s) => s.totalCount())

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <header className="bg-[#0f1624] text-white shadow-lg sticky top-0 z-50">
      {/* 상단 바 */}
      <div className="border-b border-white/5 px-6 py-1.5 flex justify-between items-center">
        <span className="text-xs text-gray-500 tracking-wide">거래처 전용 포털 — vollkommen 공식 부품</span>
        {profile && (
          <div className="flex items-center gap-1 text-xs">
            <span className="text-gray-400 px-2 py-1 rounded">{profile.company_name}</span>
            {profile.role === 'admin' && (
              <>
                <span className="text-gray-700">|</span>
                <Link
                  href="/admin"
                  className="flex items-center gap-1 text-yellow-400 hover:text-yellow-300 font-semibold px-2 py-1 rounded hover:bg-yellow-400/10 transition-all"
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  관리페이지
                </Link>
              </>
            )}
            <span className="text-gray-700">|</span>
            <button
              onClick={handleLogout}
              className="text-gray-400 hover:text-white px-2 py-1 rounded hover:bg-white/5 transition-all"
            >
              로그아웃
            </button>
          </div>
        )}
      </div>

      {/* 메인 헤더 */}
      <div className="px-6 py-3 flex items-center justify-between">
        <Link href="/products" className="flex items-center gap-3 group">
          <div className="bg-[#c41230] text-white font-black text-base px-3 py-1.5 rounded-lg tracking-tight shadow-lg shadow-red-900/30 group-hover:shadow-red-900/50 transition-shadow">
            CMC
          </div>
          <div>
            <div className="font-bold text-base leading-tight tracking-tight text-white">CustomMyCar</div>
            <div className="text-[10px] text-gray-500 leading-tight tracking-wider uppercase">vollkommen Official Portal</div>
          </div>
        </Link>

        <nav className="hidden md:flex items-center gap-1 text-sm font-medium">
          {[
            { href: '/products', label: '제품 카탈로그' },
            { href: '/orders', label: '주문 내역' },
          ].map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className={`px-4 py-2 rounded-lg transition-all ${
                pathname.startsWith(href)
                  ? 'bg-white/10 text-white font-semibold'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              {label}
            </Link>
          ))}
        </nav>

        <Link
          href="/cart"
          className="relative flex items-center gap-2 bg-[#c41230] hover:bg-[#a50e28] px-4 py-2 rounded-xl text-sm font-bold transition-all shadow-md hover:shadow-lg shadow-red-900/30"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          장바구니
          {totalCount > 0 && (
            <span className="absolute -top-1.5 -right-1.5 bg-yellow-400 text-[#1a2744] text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center shadow-sm">
              {totalCount > 9 ? '9+' : totalCount}
            </span>
          )}
        </Link>
      </div>
    </header>
  )
}
