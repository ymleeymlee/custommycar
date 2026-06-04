'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useCartStore } from '@/lib/store/cartStore'

export default function BottomCartBar() {
  const totalCount = useCartStore(s => s.totalCount())
  const pathname = usePathname()

  if (totalCount === 0) return null
  if (!pathname.startsWith('/products')) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 px-4 pb-4 pt-2">
      <div className="max-w-2xl mx-auto">
      <Link
        href="/cart"
        className="flex items-center justify-center gap-4 bg-gradient-to-r from-[#e11d48] to-[#be123c] text-white rounded-2xl px-5 py-3.5 shadow-2xl shadow-red-900/30 hover:-translate-y-0.5 transition-all"
      >
        <div className="flex items-center gap-2.5">
          <div className="relative">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <span className="absolute -top-2 -right-2 bg-white text-rose-600 text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center">
              {totalCount > 9 ? '9+' : totalCount}
            </span>
          </div>
          <span className="text-sm font-bold">결제 하기</span>
        </div>
        <span className="text-sm font-black text-yellow-400">{totalCount}개</span>
      </Link>
      </div>
    </div>
  )
}
